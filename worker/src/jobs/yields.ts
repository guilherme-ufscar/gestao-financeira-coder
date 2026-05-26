import { PrismaClient } from '@prisma/client';

export async function calculateYields(prisma: PrismaClient) {
  const accounts = await prisma.account.findMany({
    where: { yieldsEnabled: true, yieldRatePercent: { not: null } },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const account of accounts) {
    if (!account.yieldRatePercent) continue;

    const existingEntry = await prisma.yieldEntry.findFirst({
      where: { accountId: account.id, date: today },
    });
    if (existingEntry) continue;

    const eligibleBalance = account.yieldCapInCents
      ? Math.min(account.balanceInCents, account.yieldCapInCents)
      : account.balanceInCents;

    if (eligibleBalance <= 0) continue;

    // Daily rate from annual rate
    const dailyRate = account.yieldRatePercent / 100 / 365;
    const yieldAmount = Math.round(eligibleBalance * dailyRate);

    if (yieldAmount <= 0) continue;

    await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: account.id },
        data: { balanceInCents: { increment: yieldAmount } },
      });

      await tx.yieldEntry.create({
        data: {
          accountId: account.id,
          amountInCents: yieldAmount,
          date: today,
        },
      });
    });
  }
}
