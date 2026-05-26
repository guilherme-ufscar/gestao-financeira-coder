import { PrismaClient } from '@prisma/client';
import webPush from 'web-push';
import { addDays } from 'date-fns';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:contato@codermaster.com.br',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function sendDueNotifications(prisma: PrismaClient) {
  const tomorrow = addDays(new Date(), 1);
  tomorrow.setHours(23, 59, 59, 999);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Pending transactions due tomorrow
  const dueTx = await prisma.transaction.findMany({
    where: {
      status: 'pending',
      date: { gte: today, lte: tomorrow },
    },
    include: { user: true },
  });

  for (const tx of dueTx) {
    await createAndSendNotification(prisma, {
      userId: tx.userId,
      type: 'due_transaction',
      title: 'Vencimento proximo',
      body: tx.description + ' vence amanha (R$ ' + (tx.amountInCents / 100).toFixed(2) + ')',
    });
  }

  // Invoices due soon
  const now = new Date();
  const invoices = await prisma.invoice.findMany({
    where: { status: 'open' },
    include: { creditCard: { include: { user: true } } },
  });

  for (const invoice of invoices) {
    const dueDate = new Date(invoice.year, invoice.month - 1, invoice.creditCard.dueDay);
    const diff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (diff >= 0 && diff <= 2) {
      await createAndSendNotification(prisma, {
        userId: invoice.creditCard.userId,
        type: 'due_invoice',
        title: 'Fatura vencendo',
        body: 'Fatura do ' + invoice.creditCard.name + ' vence em breve (R$ ' + (invoice.totalInCents / 100).toFixed(2) + ')',
      });
    }
  }

  // Subscriptions billing soon
  const subs = await prisma.subscription.findMany({
    where: { active: true, nextBillingDate: { gte: today, lte: tomorrow } },
    include: { user: true },
  });

  for (const sub of subs) {
    await createAndSendNotification(prisma, {
      userId: sub.userId,
      type: 'subscription_billing',
      title: 'Cobranca de assinatura',
      body: sub.name + ' sera cobrado amanha (R$ ' + (sub.amountInCents / 100).toFixed(2) + ')',
    });
  }
}

async function createAndSendNotification(
  prisma: PrismaClient,
  data: { userId: string; type: string; title: string; body: string }
) {
  await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      channel: 'push',
    },
  });

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: data.userId },
  });

  const payload = JSON.stringify({ title: data.title, body: data.body, type: data.type });

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
    } catch (err: any) {
      if (err.statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      }
    }
  }
}
