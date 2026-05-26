import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';

export async function subscriptionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/', async (request) => {
    const userId = (request as any).userId;
    return prisma.subscription.findMany({
      where: { userId },
      include: { category: true, account: true },
      orderBy: { nextBillingDate: 'asc' },
    });
  });

  app.post('/', async (request, reply) => {
    const userId = (request as any).userId;
    const schema = z.object({
      name: z.string().min(1),
      logoUrl: z.string().nullable().optional(),
      amountInCents: z.number().int().positive(),
      cycle: z.enum(['monthly', 'yearly', 'weekly', 'biweekly']),
      billingDay: z.number().int().min(1).max(31),
      accountId: z.string().uuid().nullable().optional(),
      categoryId: z.string().uuid().nullable().optional(),
      nextBillingDate: z.string(),
    });

    const body = schema.parse(request.body);
    const subscription = await prisma.subscription.create({
      data: { ...body, nextBillingDate: new Date(body.nextBillingDate), userId },
    });
    return reply.status(201).send(subscription);
  });

  app.put('/:id', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };
    const schema = z.object({
      name: z.string().optional(),
      logoUrl: z.string().nullable().optional(),
      amountInCents: z.number().int().positive().optional(),
      cycle: z.enum(['monthly', 'yearly', 'weekly', 'biweekly']).optional(),
      billingDay: z.number().int().min(1).max(31).optional(),
      accountId: z.string().uuid().nullable().optional(),
      categoryId: z.string().uuid().nullable().optional(),
      active: z.boolean().optional(),
      nextBillingDate: z.string().optional(),
    });

    const body = schema.parse(request.body);
    const data: any = { ...body };
    if (body.nextBillingDate) data.nextBillingDate = new Date(body.nextBillingDate);

    const result = await prisma.subscription.updateMany({ where: { id, userId }, data });
    if (result.count === 0) return reply.status(404).send({ message: 'Assinatura nao encontrada' });
    return prisma.subscription.findUnique({ where: { id } });
  });

  app.delete('/:id', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };
    const result = await prisma.subscription.deleteMany({ where: { id, userId } });
    if (result.count === 0) return reply.status(404).send({ message: 'Assinatura nao encontrada' });
    return { message: 'Assinatura removida' };
  });
}
