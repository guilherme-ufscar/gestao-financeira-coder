import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import { sendCircleInviteEmail } from '../../lib/email.js';

export async function familyRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  function generateJoinCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  app.get('/circles', async (request) => {
    const userId = (request as any).userId;
    const memberships = await prisma.circleMember.findMany({
      where: { userId },
      include: { circle: { include: { members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } } } },
    });
    return memberships.map((m) => m.circle);
  });

  app.post('/circles', async (request, reply) => {
    const userId = (request as any).userId;
    const schema = z.object({ name: z.string().min(1) });
    const body = schema.parse(request.body);

    const joinCode = generateJoinCode();

    const circle = await prisma.$transaction(async (tx) => {
      const c = await tx.familyCircle.create({ data: { name: body.name, ownerId: userId, joinCode } });
      await tx.circleMember.create({ data: { circleId: c.id, userId, role: 'admin' } });
      return c;
    });

    return reply.status(201).send(circle);
  });

  app.post('/circles/:id/invite', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };
    const schema = z.object({ email: z.string().email() });
    const body = schema.parse(request.body);

    const member = await prisma.circleMember.findFirst({ where: { circleId: id, userId, role: 'admin' } });
    if (!member) return reply.status(403).send({ message: 'Sem permissao' });

    const circle = await prisma.familyCircle.findUnique({ where: { id } });
    if (!circle) return reply.status(404).send({ message: 'Circulo nao encontrado' });

    const existing = await prisma.circleInvite.findFirst({
      where: { circleId: id, email: body.email, status: 'pending' },
    });
    if (existing) return reply.status(409).send({ message: 'Convite ja enviado' });

    const invite = await prisma.circleInvite.create({
      data: {
        circleId: id,
        email: body.email,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const inviter = await prisma.user.findUnique({ where: { id: userId } });
    sendCircleInviteEmail(body.email, inviter?.name || 'Alguem', circle.name).catch(() => {});

    return reply.status(201).send(invite);
  });

  app.get('/invites', async (request) => {
    const userId = (request as any).userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];

    return prisma.circleInvite.findMany({
      where: { email: user.email, status: 'pending', expiresAt: { gt: new Date() } },
      include: { circle: true },
    });
  });

  app.post('/invites/:id/accept', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.status(404).send({ message: 'Usuario nao encontrado' });

    const invite = await prisma.circleInvite.findFirst({
      where: { id, email: user.email, status: 'pending', expiresAt: { gt: new Date() } },
    });
    if (!invite) return reply.status(404).send({ message: 'Convite nao encontrado ou expirado' });

    await prisma.$transaction(async (tx) => {
      await tx.circleInvite.update({ where: { id }, data: { status: 'accepted' } });
      await tx.circleMember.create({ data: { circleId: invite.circleId, userId, role: 'member' } });
    });

    return { message: 'Convite aceito' };
  });

  app.post('/invites/:id/reject', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.status(404).send({ message: 'Usuario nao encontrado' });

    const invite = await prisma.circleInvite.findFirst({
      where: { id, email: user.email, status: 'pending' },
    });
    if (!invite) return reply.status(404).send({ message: 'Convite nao encontrado' });

    await prisma.circleInvite.update({ where: { id }, data: { status: 'rejected' } });
    return { message: 'Convite recusado' };
  });

  app.post('/circles/join', async (request, reply) => {
    const userId = (request as any).userId;
    const schema = z.object({ code: z.string().length(4) });
    const body = schema.parse(request.body);

    const circle = await prisma.familyCircle.findFirst({
      where: { joinCode: body.code.toUpperCase() },
    });
    if (!circle) return reply.status(404).send({ message: 'Codigo invalido' });

    const existing = await prisma.circleMember.findFirst({
      where: { circleId: circle.id, userId },
    });
    if (existing) return reply.status(409).send({ message: 'Voce ja faz parte deste circulo' });

    await prisma.circleMember.create({
      data: { circleId: circle.id, userId, role: 'member' },
    });

    return { message: 'Entrou no circulo', circleName: circle.name };
  });

  app.get('/circles/:id/summary', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };

    const member = await prisma.circleMember.findFirst({ where: { circleId: id, userId } });
    if (!member) return reply.status(403).send({ message: 'Sem permissao' });

    const members = await prisma.circleMember.findMany({
      where: { circleId: id },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    const memberIds = members.filter((m) => m.shareAccounts).map((m) => m.userId);

    const accounts = await prisma.account.findMany({ where: { userId: { in: memberIds } } });
    const totalBalance = accounts.reduce((sum, a) => sum + a.balanceInCents, 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const transactions = await prisma.transaction.findMany({
      where: { userId: { in: memberIds }, date: { gte: startOfMonth, lte: endOfMonth } },
    });

    const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amountInCents, 0);
    const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amountInCents, 0);

    return {
      members: members.map((m) => ({ ...m.user, role: m.role })),
      totalBalance,
      monthIncome: income,
      monthExpenses: expenses,
    };
  });
}
