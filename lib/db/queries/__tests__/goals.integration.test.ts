import { initTestDatabase, resetTestDb } from '@/lib/db/testing';
import {
  archiveGoal,
  createGoal,
  deleteGoal,
  getGoalById,
  getGoalProgress,
  setGoalLinkedAccount,
} from '@/lib/db/queries/goals';
import { createTransaction, getTransactionById } from '@/lib/db/queries/transactions';
import { createTestAccount, getFirstExpenseCategory, JUNE_2026_15 } from '@/lib/db/testing/fixtures';

beforeEach(async () => {
  await initTestDatabase();
});

afterEach(() => {
  resetTestDb();
});

describe('goals CRUD', () => {
  it('createGoal persists savings and loan goals as active', async () => {
    const savings = await createGoal({
      name: 'Emergency',
      type: 'savings',
      targetAmount: 5000,
      startingBalance: 100,
      targetDate: null,
      accountId: null,
    });
    const loan = await createGoal({
      name: 'Car loan',
      type: 'loan',
      targetAmount: 10000,
      startingBalance: 0,
      targetDate: null,
      accountId: null,
    });

    expect(savings.status).toBe('active');
    expect(loan.status).toBe('active');
    expect(loan.accountId).toBeNull();
    expect(await getGoalById(savings.id)).toBeDefined();
  });

  it('auto-links savings goal on expense for linked account', async () => {
    const account = await createTestAccount('Savings acct', 0);
    const goal = await createGoal({
      name: 'Vacation',
      type: 'savings',
      targetAmount: 3000,
      startingBalance: 0,
      targetDate: null,
      accountId: account.id,
    });
    const category = await getFirstExpenseCategory();
    const tx = await createTransaction({
      type: 'expense',
      amount: 50,
      accountId: account.id,
      categoryId: category.id,
      fromAccountId: null,
      toAccountId: null,
      goalId: null,
      note: null,
      date: JUNE_2026_15,
      paid: true,
    });
    const stored = await getTransactionById(tx.id);
    expect(stored?.goalId).toBe(goal.id);
  });

  it('getGoalProgress reflects income and expense on linked account', async () => {
    const account = await createTestAccount('Goal acct', 0);
    const goal = await createGoal({
      name: 'Fund',
      type: 'savings',
      targetAmount: 1000,
      startingBalance: 100,
      targetDate: null,
      accountId: account.id,
    });
    const expenseCat = await getFirstExpenseCategory();
    await createTransaction({
      type: 'income',
      amount: 200,
      accountId: account.id,
      categoryId: expenseCat.id,
      fromAccountId: null,
      toAccountId: null,
      goalId: null,
      note: null,
      date: JUNE_2026_15,
      paid: true,
    });
    await createTransaction({
      type: 'expense',
      amount: 50,
      accountId: account.id,
      categoryId: expenseCat.id,
      fromAccountId: null,
      toAccountId: null,
      goalId: null,
      note: null,
      date: JUNE_2026_15,
      paid: true,
    });

    const progress = await getGoalProgress(goal.id);
    expect(progress?.progress).toBe(250); // 100 + 200 - 50
    expect(progress?.remaining).toBe(750);
  });

  it('setGoalLinkedAccount rejects account already linked to another goal', async () => {
    const acct1 = await createTestAccount('A1');
    const acct2 = await createTestAccount('A2');
    await createGoal({
      name: 'First',
      type: 'savings',
      targetAmount: 1000,
      startingBalance: 0,
      targetDate: null,
      accountId: acct1.id,
    });
    const second = await createGoal({
      name: 'Second',
      type: 'savings',
      targetAmount: 2000,
      startingBalance: 0,
      targetDate: null,
      accountId: null,
    });
    const result = await setGoalLinkedAccount(second.id, acct1.id);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('already linked');
  });

  it('archiveGoal sets status to archived', async () => {
    const goal = await createGoal({
      name: 'Old',
      type: 'loan',
      targetAmount: 500,
      startingBalance: 0,
      targetDate: null,
      accountId: null,
    });
    await archiveGoal(goal.id);
    expect((await getGoalById(goal.id))?.status).toBe('archived');
  });

  it('deleteGoal removes the row', async () => {
    const goal = await createGoal({
      name: 'Temp',
      type: 'loan',
      targetAmount: 100,
      startingBalance: 0,
      targetDate: null,
      accountId: null,
    });
    await deleteGoal(goal.id);
    expect(await getGoalById(goal.id)).toBeUndefined();
  });
});
