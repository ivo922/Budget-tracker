import {
  countsTowardBalance,
  defaultPaidForDate,
  rollupCategoryTotals,
  signedGoalContribution,
} from './helpers';
import type { Category, Goal, Transaction } from '@/lib/db/schema';

const savingsGoal: Pick<Goal, 'type' | 'accountId'> = { type: 'savings', accountId: 'acct-1' };
const loanGoal: Pick<Goal, 'type' | 'accountId'> = { type: 'loan', accountId: null };

describe('countsTowardBalance', () => {
  it('counts transfers always', () => {
    expect(countsTowardBalance({ type: 'transfer', paid: false })).toBe(true);
  });

  it('counts income/expense only when paid', () => {
    expect(countsTowardBalance({ type: 'expense', paid: true })).toBe(true);
    expect(countsTowardBalance({ type: 'income', paid: false })).toBe(false);
  });
});

describe('defaultPaidForDate', () => {
  it('marks today and past dates as paid', () => {
    expect(defaultPaidForDate(new Date())).toBe(true);
    expect(defaultPaidForDate(new Date('2020-01-01'))).toBe(true);
  });

  it('marks future dates as unpaid', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(defaultPaidForDate(future)).toBe(false);
  });
});

describe('signedGoalContribution', () => {
  const base = {
    amount: 100,
    paid: true,
    accountId: 'acct-1',
    fromAccountId: null,
    toAccountId: null,
  };

  it('returns 0 for unpaid non-transfer txs', () => {
    expect(
      signedGoalContribution({ ...base, type: 'expense', paid: false }, savingsGoal),
    ).toBe(0);
  });

  it('handles savings goal income and expense', () => {
    expect(signedGoalContribution({ ...base, type: 'income' }, savingsGoal)).toBe(100);
    expect(signedGoalContribution({ ...base, type: 'expense' }, savingsGoal)).toBe(-100);
  });

  it('handles savings goal transfers in and out', () => {
    expect(
      signedGoalContribution(
        { ...base, type: 'transfer', toAccountId: 'acct-1', fromAccountId: 'other' },
        savingsGoal,
      ),
    ).toBe(100);
    expect(
      signedGoalContribution(
        { ...base, type: 'transfer', fromAccountId: 'acct-1', toAccountId: 'other' },
        savingsGoal,
      ),
    ).toBe(-100);
  });

  it('counts loan goal expenses only', () => {
    expect(signedGoalContribution({ ...base, type: 'expense' }, loanGoal)).toBe(100);
    expect(signedGoalContribution({ ...base, type: 'income' }, loanGoal)).toBe(0);
  });
});

describe('rollupCategoryTotals', () => {
  const parent: Category = {
    id: 'parent-1',
    name: 'Food',
    parentId: null,
    type: 'expense',
    color: '#000',
    sortOrder: 0,
  };
  const child: Category = {
    id: 'child-1',
    name: 'Groceries',
    parentId: 'parent-1',
    type: 'expense',
    color: '#000',
    sortOrder: 1,
  };
  const categoryMap = new Map([
    [parent.id, parent],
    [child.id, child],
  ]);

  it('rolls subcategory spend up to parent', () => {
    const txs = [
      { categoryId: 'child-1', amount: 50 },
      { categoryId: 'child-1', amount: 30 },
    ] as Transaction[];
    const { totals, uncategorizedTotal } = rollupCategoryTotals(txs, categoryMap);
    expect(totals.get('parent-1')).toBe(80);
    expect(uncategorizedTotal).toBe(0);
  });

  it('tracks uncategorized separately', () => {
    const txs = [{ categoryId: null, amount: 25 }] as Transaction[];
    const { uncategorizedTotal } = rollupCategoryTotals(txs, categoryMap);
    expect(uncategorizedTotal).toBe(25);
  });
});
