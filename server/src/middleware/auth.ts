import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../lib/jwt.js';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ message: 'Token nao fornecido' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    (request as any).userId = payload.userId;
    (request as any).userEmail = payload.email;
  } catch {
    return reply.status(401).send({ message: 'Token invalido ou expirado' });
  }
}
