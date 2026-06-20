import { endOfDay } from 'date-fns';
import { and, eq, or } from 'drizzle-orm';
import { getDb } from '@/lib/db/index';
import { transactions, type Category, type Goal, type Transaction } from '@/lib/db/schema';

export function countsTowardBalance(tx: Pick<Transaction, 'type' | 'paid'>): boolean {
  return tx.type === 'transfer' || tx.paid;
}

export function defaultPaidForDate(date: Date): boolean {
  return date.getTime() <= endOfDay(new Date()).getTime();
}

export function signedGoalContribution(
  tx: Pick<Transaction, 'type' | 'amount' | 'fromAccountId' | 'toAccountId' | 'accountId' | 'paid'>,
  goal: Pick<Goal, 'type' | 'accountId'>,
): number {
  if (tx.type !== 'transfer' && !tx.paid) return 0;
  if (goal.type === 'savings') {
    if (tx.type === 'income') return tx.amount;
    if (tx.type === 'expense') return -tx.amount;
    if (tx.type === 'transfer' && goal.accountId) {
      if (tx.toAccountId === goal.accountId) return tx.amount;
      if (tx.fromAccountId === goal.accountId) return -tx.amount;
    }
    return 0;
  }
  if (tx.type === 'expense') return tx.amount;
  return 0;
}

export function linkedAccountTxCondition(accountId: string) {
  return or(
    and(
      eq(transactions.accountId, accountId),
      or(eq(transactions.type, 'income'), eq(transactions.type, 'expense')),
    ),
    and(
      eq(transactions.type, 'transfer'),
      or(eq(transactions.fromAccountId, accountId), eq(transactions.toAccountId, accountId)),
    ),
  );
}

export async function getGoalContributingTransactions(goal: Goal): Promise<Transaction[]> {
  const db = getDb();
  const byId = new Map<string, Transaction>();

  if (goal.type === 'savings' && goal.accountId) {
    const onAccount = await db
      .select()
      .from(transactions)
      .where(linkedAccountTxCondition(goal.accountId));
    for (const tx of onAccount) byId.set(tx.id, tx);
  }

  const tagged = await db.select().from(transactions).where(eq(transactions.goalId, goal.id));
  for (const tx of tagged) byId.set(tx.id, tx);

  return [...byId.values()].sort((a, b) => {
    if (a.date !== b.date) return b.date - a.date;
    return b.createdAt - a.createdAt;
  });
}

export function rollupCategoryTotals(
  typedTx: Transaction[],
  categoryMap: Map<string, Category>,
): { totals: Map<string, number>; uncategorizedTotal: number } {
  let uncategorizedTotal = 0;
  const totals = new Map<string, number>();

  for (const tx of typedTx) {
    if (!tx.categoryId) {
      uncategorizedTotal += tx.amount;
      continue;
    }
    const cat = categoryMap.get(tx.categoryId);
    if (!cat) continue;
    const rollupId = cat.parentId ?? cat.id;
    totals.set(rollupId, (totals.get(rollupId) ?? 0) + tx.amount);
  }

  return { totals, uncategorizedTotal };
}
