import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';

export async function investmentRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/', async (request) => {
    const userId = (request as any).userId;
    return prisma.investment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  });

  app.post('/', async (request, reply) => {
    const userId = (request as any).userId;
    const schema = z.object({
      type: z.string(),
      name: z.string().min(1),
      ticker: z.string().nullable().optional(),
      amountInCents: z.number().int().positive(),
      currentValueInCents: z.number().int().positive(),
      yieldRatePercent: z.number().nullable().optional(),
      yieldType: z.string().nullable().optional(),
      startDate: z.string(),
      note: z.string().nullable().optional(),
    });

    const body = schema.parse(request.body);
    const investment = await prisma.investment.create({
      data: { ...body, startDate: new Date(body.startDate), userId },
    });
    return reply.status(201).send(investment);
  });

  app.put('/:id', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };
    const schema = z.object({
      name: z.string().optional(),
      ticker: z.string().nullable().optional(),
      currentValueInCents: z.number().int().optional(),
      yieldRatePercent: z.number().nullable().optional(),
      yieldType: z.string().nullable().optional(),
      note: z.string().nullable().optional(),
    });

    const body = schema.parse(request.body);
    const result = await prisma.investment.updateMany({ where: { id, userId }, data: body });
    if (result.count === 0) return reply.status(404).send({ message: 'Investimento nao encontrado' });
    return prisma.investment.findUnique({ where: { id } });
  });

  app.delete('/:id', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };
    const result = await prisma.investment.deleteMany({ where: { id, userId } });
    if (result.count === 0) return reply.status(404).send({ message: 'Investimento nao encontrado' });
    return { message: 'Investimento removido' };
  });
}
