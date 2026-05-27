import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import { addMonths } from 'date-fns';

export async function transactionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/', async (request) => {
    const userId = (request as any).userId;
    const query = request.query as any;

    const where: any = { userId };
    if (query.accountId) where.accountId = query.accountId;
    if (query.creditCardId) where.creditCardId = query.creditCardId;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true, account: true, creditCard: true, installments: true },
      orderBy: { date: 'desc' },
      take: Number(query.limit) || 50,
      skip: Number(query.offset) || 0,
    });
    return transactions;
  });

  app.post('/', async (request, reply) => {
    const userId = (request as any).userId;
    const schema = z.object({
      type: z.enum(['income', 'expense']),
      amountInCents: z.number().int().positive(),
      description: z.string().min(1),
      date: z.string(),
      status: z.enum(['paid', 'pending']).default('pending'),
      note: z.string().nullable().optional(),
      accountId: z.string().uuid().nullable().optional(),
      creditCardId: z.string().uuid().nullable().optional(),
      categoryId: z.string().uuid().nullable().optional(),
      installments: z.number().int().min(1).max(72).default(1),
    });

    const body = schema.parse(request.body);
    const { installments: installmentCount, ...txData } = body;

    const transaction = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          ...txData,
          date: new Date(txData.date),
          userId,
        },
      });

      if (installmentCount > 1 && body.creditCardId) {
        const perInstallment = Math.floor(body.amountInCents / installmentCount);
        const remainder = body.amountInCents - perInstallment * installmentCount;

        const card = await tx.creditCard.findUnique({ where: { id: body.creditCardId } });
        if (!card) throw new Error('Cartao nao encontrado');

        for (let i = 0; i < installmentCount; i++) {
          const dueDate = addMonths(new Date(body.date), i);
          const amount = i === 0 ? perInstallment + remainder : perInstallment;

          const invoiceMonth = dueDate.getMonth() + 1;
          const invoiceYear = dueDate.getFullYear();

          let invoice = await tx.invoice.findUnique({
            where: { creditCardId_month_year: { creditCardId: card.id, month: invoiceMonth, year: invoiceYear } },
          });

          if (!invoice) {
            invoice = await tx.invoice.create({
              data: { creditCardId: card.id, month: invoiceMonth, year: invoiceYear, totalInCents: 0 },
            });
          }

          await tx.installment.create({
            data: {
              transactionId: created.id,
              invoiceId: invoice.id,
              number: i + 1,
              totalCount: installmentCount,
              amountInCents: amount,
              dueDate,
            },
          });

          await tx.invoice.update({
            where: { id: invoice.id },
            data: { totalInCents: { increment: amount } },
          });
        }
      }

      if (body.status === 'paid' && body.accountId && !body.creditCardId) {
        const increment = body.type === 'income' ? body.amountInCents : -body.amountInCents;
        await tx.account.update({
          where: { id: body.accountId },
          data: { balanceInCents: { increment } },
        });
      }

      return created;
    });

    return reply.status(201).send(transaction);
  });

  app.put('/:id', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };
    const schema = z.object({
      description: z.string().optional(),
      amountInCents: z.number().int().positive().optional(),
      date: z.string().optional(),
      status: z.enum(['paid', 'pending']).optional(),
      note: z.string().nullable().optional(),
      categoryId: z.string().uuid().nullable().optional(),
    });

    const body = schema.parse(request.body);
    const existing = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) return reply.status(404).send({ message: 'Transacao nao encontrada' });

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.transaction.update({
        where: { id },
        data: { ...body, date: body.date ? new Date(body.date) : undefined },
      });

      if (body.status === 'paid' && existing.status === 'pending' && existing.accountId && !existing.creditCardId) {
        const increment = existing.type === 'income' ? existing.amountInCents : -existing.amountInCents;
        await tx.account.update({
          where: { id: existing.accountId },
          data: { balanceInCents: { increment } },
        });
      }

      return result;
    });

    return updated;
  });

  app.delete('/:id', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };
    const existing = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) return reply.status(404).send({ message: 'Transacao nao encontrada' });

    await prisma.$transaction(async (tx) => {
      if (existing.status === 'paid' && existing.accountId && !existing.creditCardId) {
        const decrement = existing.type === 'income' ? -existing.amountInCents : existing.amountInCents;
        await tx.account.update({
          where: { id: existing.accountId },
          data: { balanceInCents: { increment: decrement } },
        });
      }

      const installments = await tx.installment.findMany({ where: { transactionId: id } });
      for (const inst of installments) {
        if (inst.invoiceId) {
          await tx.invoice.update({
            where: { id: inst.invoiceId },
            data: { totalInCents: { decrement: inst.amountInCents } },
          });
        }
      }

      await tx.installment.deleteMany({ where: { transactionId: id } });
      await tx.transaction.delete({ where: { id } });
    });

    return { message: 'Transacao removida' };
  });

  app.get('/categories', async (request) => {
    const userId = (request as any).userId;
    return prisma.category.findMany({
      where: { OR: [{ userId }, { isDefault: true, userId: null }] },
      include: { children: true },
      orderBy: { name: 'asc' },
    });
  });

  app.post('/categories', async (request, reply) => {
    const userId = (request as any).userId;
    const schema = z.object({
      name: z.string().min(1),
      icon: z.string(),
      color: z.string(),
      type: z.enum(['income', 'expense']),
      parentId: z.string().uuid().nullable().optional(),
    });

    const body = schema.parse(request.body);
    const category = await prisma.category.create({
      data: { ...body, userId },
    });
    return reply.status(201).send(category);
  });

  app.put('/categories/:id', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };
    const schema = z.object({
      name: z.string().min(1).optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
    });

    const body = schema.parse(request.body);
    const cat = await prisma.category.findFirst({ where: { id, userId } });
    if (!cat) return reply.status(403).send({ message: 'Categoria nao encontrada ou padrao' });

    const updated = await prisma.category.update({ where: { id }, data: body });
    return updated;
  });

  app.delete('/categories/:id', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };

    const cat = await prisma.category.findFirst({ where: { id, userId } });
    if (!cat) return reply.status(403).send({ message: 'Apenas categorias personalizadas podem ser excluidas' });

    await prisma.transaction.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
    await prisma.category.delete({ where: { id } });
    return { message: 'Categoria excluida' };
  });
}
