import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';

export async function budgetRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/', async (request) => {
    const userId = (request as any).userId;
    const query = request.query as any;
    const month = Number(query.month) || new Date().getMonth() + 1;
    const year = Number(query.year) || new Date().getFullYear();

    return prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: true },
    });
  });

  app.post('/', async (request, reply) => {
    const userId = (request as any).userId;
    const schema = z.object({
      categoryId: z.string().uuid(),
      month: z.number().int().min(1).max(12),
      year: z.number().int(),
      limitInCents: z.number().int().positive(),
    });

    const body = schema.parse(request.body);
    const budget = await prisma.budget.upsert({
      where: { userId_categoryId_month_year: { userId, categoryId: body.categoryId, month: body.month, year: body.year } },
      update: { limitInCents: body.limitInCents },
      create: { ...body, userId },
    });
    return reply.status(201).send(budget);
  });

  app.delete('/:id', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };
    const result = await prisma.budget.deleteMany({ where: { id, userId } });
    if (result.count === 0) return reply.status(404).send({ message: 'Orcamento nao encontrado' });
    return { message: 'Orcamento removido' };
  });

  // Goals
  app.get('/goals', async (request) => {
    const userId = (request as any).userId;
    return prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  });

  app.post('/goals', async (request, reply) => {
    const userId = (request as any).userId;
    const schema = z.object({
      name: z.string().min(1),
      targetInCents: z.number().int().positive(),
      currentInCents: z.number().int().default(0),
      deadline: z.string().nullable().optional(),
      color: z.string().optional(),
    });

    const body = schema.parse(request.body);
    const goal = await prisma.goal.create({
      data: { ...body, deadline: body.deadline ? new Date(body.deadline) : null, userId },
    });
    return reply.status(201).send(goal);
  });

  app.put('/goals/:id', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };
    const schema = z.object({
      name: z.string().optional(),
      targetInCents: z.number().int().positive().optional(),
      currentInCents: z.number().int().optional(),
      deadline: z.string().nullable().optional(),
      color: z.string().optional(),
    });

    const body = schema.parse(request.body);
    const data: any = { ...body };
    if (body.deadline !== undefined) data.deadline = body.deadline ? new Date(body.deadline) : null;

    const result = await prisma.goal.updateMany({ where: { id, userId }, data });
    if (result.count === 0) return reply.status(404).send({ message: 'Meta nao encontrada' });
    return prisma.goal.findUnique({ where: { id } });
  });

  app.delete('/goals/:id', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };
    const result = await prisma.goal.deleteMany({ where: { id, userId } });
    if (result.count === 0) return reply.status(404).send({ message: 'Meta nao encontrada' });
    return { message: 'Meta removida' };
  });

  // Debts
  app.get('/debts', async (request) => {
    const userId = (request as any).userId;
    return prisma.debt.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  });

  app.post('/debts', async (request, reply) => {
    const userId = (request as any).userId;
    const schema = z.object({
      description: z.string().min(1),
      totalInCents: z.number().int().positive(),
      remainingInCents: z.number().int(),
      creditor: z.string().nullable().optional(),
      dueDate: z.string().nullable().optional(),
    });

    const body = schema.parse(request.body);
    const debt = await prisma.debt.create({
      data: { ...body, dueDate: body.dueDate ? new Date(body.dueDate) : null, userId },
    });
    return reply.status(201).send(debt);
  });

  app.put('/debts/:id', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };
    const schema = z.object({
      description: z.string().optional(),
      totalInCents: z.number().int().positive().optional(),
      remainingInCents: z.number().int().optional(),
      creditor: z.string().nullable().optional(),
      dueDate: z.string().nullable().optional(),
      status: z.enum(['active', 'paid']).optional(),
    });

    const body = schema.parse(request.body);
    const data: any = { ...body };
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

    const result = await prisma.debt.updateMany({ where: { id, userId }, data });
    if (result.count === 0) return reply.status(404).send({ message: 'Divida nao encontrada' });
    return prisma.debt.findUnique({ where: { id } });
  });

  app.delete('/debts/:id', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };
    const result = await prisma.debt.deleteMany({ where: { id, userId } });
    if (result.count === 0) return reply.status(404).send({ message: 'Divida nao encontrada' });
    return { message: 'Divida removida' };
  });
}
