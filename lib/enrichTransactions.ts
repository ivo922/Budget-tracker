import type { TransactionListItem } from '@/components/TransactionGroupedList';
import { getAccounts, getCategories, signedGoalContribution } from '@/lib/db/queries';
import type { Goal, Transaction } from '@/lib/db/schema';

export type EnrichTransactionsOptions = {
  goalNames?: Map<string, string>;
  /** Goal detail screen: attach contribution per tx */
  goal?: Goal;
};

export async function enrichTransactions(
  txs: Transaction[],
  options: EnrichTransactionsOptions = {},
): Promise<TransactionListItem[]> {
  if (txs.length === 0) return [];

  const [accounts, categories] = await Promise.all([getAccounts(), getCategories()]);
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const { goalNames, goal } = options;

  return txs.map((tx) => ({
    tx,
    account: tx.accountId ? accountMap.get(tx.accountId) : undefined,
    category: tx.categoryId ? categoryMap.get(tx.categoryId) : undefined,
    fromAccount: tx.fromAccountId ? accountMap.get(tx.fromAccountId) : undefined,
    toAccount: tx.toAccountId ? accountMap.get(tx.toAccountId) : undefined,
    goalName: goal?.name ?? (tx.goalId ? goalNames?.get(tx.goalId) : undefined),
    goalId: goal?.id ?? tx.goalId ?? undefined,
    goalContribution: goal ? signedGoalContribution(tx, goal) : undefined,
  }));
}

if (__DEV__) {
  const tx = {
    id: '1',
    accountId: 'a1',
    categoryId: null,
    fromAccountId: null,
    toAccountId: null,
    goalId: 'g1',
    date: 0,
    createdAt: 0,
    type: 'expense' as const,
    amount: 1,
    note: null,
    paid: true,
  };
  enrichTransactions([tx], { goalNames: new Map([['g1', 'Vacation']]) }).then((rows) => {
    console.assert(rows[0]?.goalName === 'Vacation');
  });
}
