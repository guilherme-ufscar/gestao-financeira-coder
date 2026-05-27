import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';

export async function accountRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/', async (request) => {
    const userId = (request as any).userId;
    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return accounts;
  });

  app.post('/', async (request, reply) => {
    const userId = (request as any).userId;
    const schema = z.object({
      name: z.string().min(1),
      type: z.string(),
      bankSlug: z.string().nullable().optional(),
      color: z.string().optional(),
      balanceInCents: z.number().int().default(0),
      yieldsEnabled: z.boolean().default(false),
      yieldRatePercent: z.number().nullable().optional(),
      yieldType: z.string().nullable().optional(),
      yieldCapInCents: z.number().int().nullable().optional(),
    });

    const body = schema.parse(request.body);
    const account = await prisma.account.create({
      data: { ...body, userId },
    });
    return reply.status(201).send(account);
  });

  app.put('/:id', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };
    const schema = z.object({
      name: z.string().min(1).optional(),
      type: z.string().optional(),
      bankSlug: z.string().nullable().optional(),
      color: z.string().optional(),
      isDefault: z.boolean().optional(),
      yieldsEnabled: z.boolean().optional(),
      yieldRatePercent: z.number().nullable().optional(),
      yieldType: z.string().nullable().optional(),
      yieldCapInCents: z.number().int().nullable().optional(),
    });

    const body = schema.parse(request.body);

    if (body.isDefault) {
      await prisma.account.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const account = await prisma.account.updateMany({
      where: { id, userId },
      data: body,
    });
    if (account.count === 0) return reply.status(404).send({ message: 'Conta nao encontrada' });
    return prisma.account.findUnique({ where: { id } });
  });

  app.delete('/:id', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };
    const result = await prisma.account.deleteMany({ where: { id, userId } });
    if (result.count === 0) return reply.status(404).send({ message: 'Conta nao encontrada' });
    return { message: 'Conta removida' };
  });

  app.post('/transfer', async (request, reply) => {
    const userId = (request as any).userId;
    const schema = z.object({
      fromAccountId: z.string().uuid(),
      toAccountId: z.string().uuid(),
      amountInCents: z.number().int().positive(),
      date: z.string(),
      note: z.string().nullable().optional(),
    });

    const body = schema.parse(request.body);

    const [from, to] = await Promise.all([
      prisma.account.findFirst({ where: { id: body.fromAccountId, userId } }),
      prisma.account.findFirst({ where: { id: body.toAccountId, userId } }),
    ]);

    if (!from || !to) return reply.status(404).send({ message: 'Conta nao encontrada' });

    const transfer = await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: from.id },
        data: { balanceInCents: { decrement: body.amountInCents } },
      });
      await tx.account.update({
        where: { id: to.id },
        data: { balanceInCents: { increment: body.amountInCents } },
      });
      return tx.transfer.create({
        data: {
          fromAccountId: body.fromAccountId,
          toAccountId: body.toAccountId,
          amountInCents: body.amountInCents,
          date: new Date(body.date),
          note: body.note,
        },
      });
    });

    return reply.status(201).send(transfer);
  });
}
