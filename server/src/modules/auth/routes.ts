import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt.js';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../../lib/email.js';
import { authenticate } from '../../middleware/auth.js';

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  });
  const data = await res.json() as { success: boolean };
  return data.success;
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      turnstileToken: z.string(),
    });

    const body = schema.parse(request.body);

    const turnstileValid = await verifyTurnstile(body.turnstileToken);
    if (!turnstileValid) {
      return reply.status(400).send({ message: 'Verificacao de seguranca falhou' });
    }

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return reply.status(409).send({ message: 'E-mail ja cadastrado' });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash,
      },
    });

    const tokenPayload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await seedDefaultCategories(user.id);

    sendWelcomeEmail(user.email, user.name).catch(() => {});

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60,
    });

    return reply.status(201).send({
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: null, theme: user.theme },
      token: accessToken,
    });
  });

  app.post('/login', async (request, reply) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string(),
    });

    const body = schema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return reply.status(401).send({ message: 'E-mail ou senha incorretos' });
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ message: 'E-mail ou senha incorretos' });
    }

    const tokenPayload = { userId: user.id, email: user.email };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60,
    });

    return {
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, theme: user.theme },
      token: accessToken,
    };
  });

  app.post('/refresh', async (request, reply) => {
    const token = (request.cookies as any)?.refreshToken;
    if (!token) {
      return reply.status(401).send({ message: 'Refresh token nao encontrado' });
    }

    try {
      const payload = verifyRefreshToken(token);
      const stored = await prisma.refreshToken.findUnique({ where: { token } });
      if (!stored || stored.expiresAt < new Date()) {
        return reply.status(401).send({ message: 'Refresh token invalido' });
      }

      await prisma.refreshToken.delete({ where: { id: stored.id } });

      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) {
        return reply.status(401).send({ message: 'Usuario nao encontrado' });
      }

      const newPayload = { userId: user.id, email: user.email };
      const newAccessToken = signAccessToken(newPayload);
      const newRefreshToken = signRefreshToken(newPayload);

      await prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      reply.setCookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/auth/refresh',
        maxAge: 7 * 24 * 60 * 60,
      });

      return {
        user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, theme: user.theme },
        token: newAccessToken,
      };
    } catch {
      return reply.status(401).send({ message: 'Refresh token invalido' });
    }
  });

  app.post('/forgot-password', async (request, reply) => {
    const schema = z.object({ email: z.string().email() });
    const { email } = schema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'Se o e-mail existir, enviaremos o link' };
    }

    const token = randomUUID();
    await prisma.passwordReset.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await sendPasswordResetEmail(email, token);
    return { message: 'Se o e-mail existir, enviaremos o link' };
  });

  app.post('/reset-password', async (request, reply) => {
    const schema = z.object({
      token: z.string(),
      password: z.string().min(6),
    });
    const body = schema.parse(request.body);

    const reset = await prisma.passwordReset.findUnique({ where: { token: body.token } });
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      return reply.status(400).send({ message: 'Token invalido ou expirado' });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    await prisma.user.update({
      where: { id: reset.userId },
      data: { passwordHash },
    });

    await prisma.passwordReset.update({
      where: { id: reset.id },
      data: { usedAt: new Date() },
    });

    return { message: 'Senha redefinida com sucesso' };
  });

  app.post('/logout', { preHandler: [authenticate] }, async (request, reply) => {
    const token = (request.cookies as any)?.refreshToken;
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } });
    }
    reply.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    return { message: 'Logout realizado' };
  });

  app.get('/me', { preHandler: [authenticate] }, async (request) => {
    const userId = (request as any).userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, avatarUrl: true, theme: true },
    });
    return user;
  });
}

async function seedDefaultCategories(userId: string) {
  const defaults = [
    { name: 'Alimentacao', icon: 'utensils', color: '#FF6B6B', type: 'expense' },
    { name: 'Transporte', icon: 'car', color: '#4ECDC4', type: 'expense' },
    { name: 'Moradia', icon: 'home', color: '#45B7D1', type: 'expense' },
    { name: 'Saude', icon: 'heart-pulse', color: '#96CEB4', type: 'expense' },
    { name: 'Educacao', icon: 'graduation-cap', color: '#FFEAA7', type: 'expense' },
    { name: 'Lazer', icon: 'gamepad-2', color: '#DDA0DD', type: 'expense' },
    { name: 'Compras', icon: 'shopping-bag', color: '#F39C12', type: 'expense' },
    { name: 'Servicos', icon: 'wrench', color: '#A29BFE', type: 'expense' },
    { name: 'Outros', icon: 'ellipsis', color: '#636E72', type: 'expense' },
    { name: 'Salario', icon: 'banknote', color: '#2FD180', type: 'income' },
    { name: 'Freelance', icon: 'laptop', color: '#00B894', type: 'income' },
    { name: 'Investimentos', icon: 'trending-up', color: '#6C5CE7', type: 'income' },
    { name: 'Outros', icon: 'ellipsis', color: '#636E72', type: 'income' },
  ];

  await prisma.category.createMany({
    data: defaults.map((c) => ({ ...c, userId, isDefault: true })),
  });
}
