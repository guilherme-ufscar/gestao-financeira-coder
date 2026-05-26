import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';

export async function cardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/', async (request) => {
    const userId = (request as any).userId;
    return prisma.creditCard.findMany({
      where: { userId },
      include: { invoices: { orderBy: { year: 'desc' }, take: 3 } },
      orderBy: { createdAt: 'asc' },
    });
  });

  app.post('/', async (request, reply) => {
    const userId = (request as any).userId;
    const schema = z.object({
      name: z.string().min(1),
      brand: z.string(),
      lastFourDigits: z.string().length(4),
      limitInCents: z.number().int().positive(),
      closingDay: z.number().int().min(1).max(31),
      dueDay: z.number().int().min(1).max(31),
      paymentAccountId: z.string().uuid().nullable().optional(),
      color: z.string().optional(),
    });

    const body = schema.parse(request.body);
    const card = await prisma.creditCard.create({
      data: { ...body, userId },
    });
    return reply.status(201).send(card);
  });

  app.put('/:id', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };
    const schema = z.object({
      name: z.string().optional(),
      brand: z.string().optional(),
      lastFourDigits: z.string().length(4).optional(),
      limitInCents: z.number().int().positive().optional(),
      closingDay: z.number().int().min(1).max(31).optional(),
      dueDay: z.number().int().min(1).max(31).optional(),
      paymentAccountId: z.string().uuid().nullable().optional(),
      color: z.string().optional(),
    });

    const body = schema.parse(request.body);
    const result = await prisma.creditCard.updateMany({ where: { id, userId }, data: body });
    if (result.count === 0) return reply.status(404).send({ message: 'Cartao nao encontrado' });
    return prisma.creditCard.findUnique({ where: { id } });
  });

  app.delete('/:id', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };
    const result = await prisma.creditCard.deleteMany({ where: { id, userId } });
    if (result.count === 0) return reply.status(404).send({ message: 'Cartao nao encontrado' });
    return { message: 'Cartao removido' };
  });

  app.get('/:id/invoices', async (request) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };
    const card = await prisma.creditCard.findFirst({ where: { id, userId } });
    if (!card) return [];

    return prisma.invoice.findMany({
      where: { creditCardId: id },
      include: { installments: { include: { transaction: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  });

  app.post('/:id/invoices/:invoiceId/pay', async (request, reply) => {
    const userId = (request as any).userId;
    const { id, invoiceId } = request.params as { id: string; invoiceId: string };
    const schema = z.object({
      accountId: z.string().uuid(),
    });

    const body = schema.parse(request.body);
    const card = await prisma.creditCard.findFirst({ where: { id, userId } });
    if (!card) return reply.status(404).send({ message: 'Cartao nao encontrado' });

    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, creditCardId: id } });
    if (!invoice) return reply.status(404).send({ message: 'Fatura nao encontrada' });
    if (invoice.status === 'paid') return reply.status(400).send({ message: 'Fatura ja paga' });

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: 'paid', paidAt: new Date(), paidAccountId: body.accountId },
      });

      await tx.account.update({
        where: { id: body.accountId },
        data: { balanceInCents: { decrement: invoice.totalInCents } },
      });

      await tx.installment.updateMany({
        where: { invoiceId },
        data: { status: 'paid' },
      });
    });

    return { message: 'Fatura paga' };
  });
}
