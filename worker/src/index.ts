import 'dotenv/config';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { calculateYields } from './jobs/yields.js';
import { processRecurring } from './jobs/recurring.js';
import { sendDueNotifications } from './jobs/notifications.js';

const prisma = new PrismaClient();

console.log('Cofrin Worker started');

// Calculate account yields daily at 00:05
cron.schedule('5 0 * * *', async () => {
  console.log('[CRON] Calculating yields...');
  try {
    await calculateYields(prisma);
    console.log('[CRON] Yields calculated successfully');
  } catch (err) {
    console.error('[CRON] Yield calculation failed:', err);
  }
});

// Process recurring transactions daily at 06:00
cron.schedule('0 6 * * *', async () => {
  console.log('[CRON] Processing recurring transactions...');
  try {
    await processRecurring(prisma);
    console.log('[CRON] Recurring transactions processed');
  } catch (err) {
    console.error('[CRON] Recurring processing failed:', err);
  }
});

// Send due notifications every day at 08:00
cron.schedule('0 8 * * *', async () => {
  console.log('[CRON] Sending due notifications...');
  try {
    await sendDueNotifications(prisma);
    console.log('[CRON] Notifications sent');
  } catch (err) {
    console.error('[CRON] Notification sending failed:', err);
  }
});

// Keep process alive
process.on('SIGTERM', async () => {
  console.log('Worker shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
