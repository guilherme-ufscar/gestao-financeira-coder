import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';

export async function notificationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/', async (request) => {
    const userId = (request as any).userId;
    const query = request.query as any;
    return prisma.notification.findMany({
      where: { userId, ...(query.unread === 'true' ? { read: false } : {}) },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  });

  app.put('/:id/read', async (request, reply) => {
    const userId = (request as any).userId;
    const { id } = request.params as { id: string };
    const result = await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
    if (result.count === 0) return reply.status(404).send({ message: 'Notificacao nao encontrada' });
    return { message: 'Marcada como lida' };
  });

  app.put('/read-all', async (request) => {
    const userId = (request as any).userId;
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { message: 'Todas marcadas como lidas' };
  });

  app.post('/push-subscription', async (request, reply) => {
    const userId = (request as any).userId;
    const schema = z.object({
      endpoint: z.string().url(),
      p256dh: z.string(),
      auth: z.string(),
      platform: z.enum(['web', 'android']).default('web'),
    });

    const body = schema.parse(request.body);

    const existing = await prisma.pushSubscription.findUnique({ where: { endpoint: body.endpoint } });
    if (existing) {
      await prisma.pushSubscription.update({
        where: { endpoint: body.endpoint },
        data: { userId, p256dh: body.p256dh, auth: body.auth },
      });
    } else {
      await prisma.pushSubscription.create({ data: { ...body, userId } });
    }

    return reply.status(201).send({ message: 'Inscricao salva' });
  });

  app.delete('/push-subscription', async (request, reply) => {
    const userId = (request as any).userId;
    const schema = z.object({ endpoint: z.string().url() });
    const body = schema.parse(request.body);

    await prisma.pushSubscription.deleteMany({ where: { endpoint: body.endpoint, userId } });
    return { message: 'Inscricao removida' };
  });
}
