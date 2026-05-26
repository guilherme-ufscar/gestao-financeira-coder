import { PrismaClient } from '@prisma/client';
import { addDays, addWeeks, addMonths } from 'date-fns';

export async function processRecurring(prisma: PrismaClient) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const rules = await prisma.recurringRule.findMany({
    where: { active: true, nextOccurrence: { lte: today } },
    include: { transactions: { take: 1, orderBy: { date: 'desc' } } },
  });

  for (const rule of rules) {
    const template = rule.transactions[0];
    if (!template) continue;

    await prisma.transaction.create({
      data: {
        userId: template.userId,
        type: template.type,
        amountInCents: template.amountInCents,
        description: template.description,
        date: rule.nextOccurrence,
        status: 'pending',
        note: template.note,
        accountId: template.accountId,
        creditCardId: template.creditCardId,
        categoryId: template.categoryId,
        recurringRuleId: rule.id,
      },
    });

    let nextDate: Date;
    switch (rule.frequency) {
      case 'daily':
        nextDate = addDays(rule.nextOccurrence, rule.interval);
        break;
      case 'weekly':
        nextDate = addWeeks(rule.nextOccurrence, rule.interval);
        break;
      case 'biweekly':
        nextDate = addWeeks(rule.nextOccurrence, 2);
        break;
      case 'monthly':
        nextDate = addMonths(rule.nextOccurrence, rule.interval);
        break;
      case 'bimonthly':
        nextDate = addMonths(rule.nextOccurrence, 2);
        break;
      case 'quarterly':
        nextDate = addMonths(rule.nextOccurrence, 3);
        break;
      case 'semiannual':
        nextDate = addMonths(rule.nextOccurrence, 6);
        break;
      case 'yearly':
        nextDate = addMonths(rule.nextOccurrence, 12);
        break;
      default:
        nextDate = addMonths(rule.nextOccurrence, 1);
    }

    const shouldDeactivate = rule.endDate && nextDate > rule.endDate;

    await prisma.recurringRule.update({
      where: { id: rule.id },
      data: {
        nextOccurrence: nextDate,
        active: !shouldDeactivate,
      },
    });
  }
}
