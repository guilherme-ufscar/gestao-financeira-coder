import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRoutes } from './modules/auth/routes.js';
import { accountRoutes } from './modules/accounts/routes.js';
import { transactionRoutes } from './modules/transactions/routes.js';
import { cardRoutes } from './modules/cards/routes.js';
import { subscriptionRoutes } from './modules/subscriptions/routes.js';
import { investmentRoutes } from './modules/investments/routes.js';
import { budgetRoutes } from './modules/budget/routes.js';
import { familyRoutes } from './modules/family/routes.js';
import { notificationRoutes } from './modules/notifications/routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
  credentials: true,
});

await app.register(cookie, {
  secret: process.env.JWT_SECRET,
});

await app.register(multipart, {
  limits: { fileSize: Number(process.env.MAX_UPLOAD_SIZE) || 5242880 },
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
await app.register(fastifyStatic, {
  root: uploadDir,
  prefix: '/uploads/',
  decorateReply: false,
});

await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(accountRoutes, { prefix: '/api/accounts' });
await app.register(transactionRoutes, { prefix: '/api/transactions' });
await app.register(cardRoutes, { prefix: '/api/cards' });
await app.register(subscriptionRoutes, { prefix: '/api/subscriptions' });
await app.register(investmentRoutes, { prefix: '/api/investments' });
await app.register(budgetRoutes, { prefix: '/api/budget' });
await app.register(familyRoutes, { prefix: '/api/family' });
await app.register(notificationRoutes, { prefix: '/api/notifications' });

app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

const port = Number(process.env.PORT) || 3000;
const host = '0.0.0.0';

try {
  await app.listen({ port, host });
  console.log('Cofrin API running on ' + host + ':' + port);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
