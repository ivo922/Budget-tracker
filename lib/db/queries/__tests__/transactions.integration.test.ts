import { startOfMonth, endOfMonth } from 'date-fns';
import { initTestDatabase, resetTestDb } from '@/lib/db/testing';
import { getAccountBalance } from '@/lib/db/queries/accounts';
import {
  createTransaction,
  deleteTransaction,
  getPeriodSummary,
  updateTransaction,
} from '@/lib/db/queries/transactions';
import {
  createTestAccount,
  getFirstExpenseCategory,
  getFirstIncomeCategory,
  JUNE_2026_15,
} from '@/lib/db/testing/fixtures';

beforeEach(async () => {
  await initTestDatabase();
});

afterEach(() => {
  resetTestDb();
});

describe('transactions CRUD', () => {
  it('paid expense decreases account balance', async () => {
    const account = await createTestAccount('Main', 1000);
    const category = await getFirstExpenseCategory();
    await createTransaction({
      type: 'expense',
      amount: 150,
      accountId: account.id,
      categoryId: category.id,
      fromAccountId: null,
      toAccountId: null,
      goalId: null,
      note: null,
      date: JUNE_2026_15,
      paid: true,
    });
    expect(await getAccountBalance(account.id)).toBe(850);
  });

  it('paid income increases account balance', async () => {
    const account = await createTestAccount('Main', 100);
    const category = await getFirstIncomeCategory();
    await createTransaction({
      type: 'income',
      amount: 500,
      accountId: account.id,
      categoryId: category.id,
      fromAccountId: null,
      toAccountId: null,
      goalId: null,
      note: null,
      date: JUNE_2026_15,
      paid: true,
    });
    expect(await getAccountBalance(account.id)).toBe(600);
  });

  it('transfer moves balance between accounts', async () => {
    const from = await createTestAccount('From', 1000);
    const to = await createTestAccount('To', 200);
    await createTransaction({
      type: 'transfer',
      amount: 300,
      accountId: null,
      categoryId: null,
      fromAccountId: from.id,
      toAccountId: to.id,
      goalId: null,
      note: null,
      date: JUNE_2026_15,
      paid: true,
    });
    expect(await getAccountBalance(from.id)).toBe(700);
    expect(await getAccountBalance(to.id)).toBe(500);
  });

  it('unpaid future expense does not affect balance', async () => {
    const account = await createTestAccount('Main', 500);
    const category = await getFirstExpenseCategory();
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    await createTransaction({
      type: 'expense',
      amount: 100,
      accountId: account.id,
      categoryId: category.id,
      fromAccountId: null,
      toAccountId: null,
      goalId: null,
      note: null,
      date: future.getTime(),
      paid: false,
    });
    expect(await getAccountBalance(account.id)).toBe(500);
  });

  it('updateTransaction adjusts balance', async () => {
    const account = await createTestAccount('Main', 1000);
    const category = await getFirstExpenseCategory();
    const tx = await createTransaction({
      type: 'expense',
      amount: 100,
      accountId: account.id,
      categoryId: category.id,
      fromAccountId: null,
      toAccountId: null,
      goalId: null,
      note: null,
      date: JUNE_2026_15,
      paid: true,
    });
    await updateTransaction(tx.id, { amount: 200 });
    expect(await getAccountBalance(account.id)).toBe(800);
  });

  it('deleteTransaction restores balance', async () => {
    const account = await createTestAccount('Main', 1000);
    const category = await getFirstExpenseCategory();
    const tx = await createTransaction({
      type: 'expense',
      amount: 75,
      accountId: account.id,
      categoryId: category.id,
      fromAccountId: null,
      toAccountId: null,
      goalId: null,
      note: null,
      date: JUNE_2026_15,
      paid: true,
    });
    await deleteTransaction(tx.id);
    expect(await getAccountBalance(account.id)).toBe(1000);
  });

  it('getPeriodSummary totals income and expense in range', async () => {
    const account = await createTestAccount('Main', 0);
    const expenseCat = await getFirstExpenseCategory();
    const incomeCat = await getFirstIncomeCategory();
    const start = startOfMonth(new Date(JUNE_2026_15)).getTime();
    const end = endOfMonth(new Date(JUNE_2026_15)).getTime();

    await createTransaction({
      type: 'income',
      amount: 2000,
      accountId: account.id,
      categoryId: incomeCat.id,
      fromAccountId: null,
      toAccountId: null,
      goalId: null,
      note: null,
      date: JUNE_2026_15,
      paid: true,
    });
    await createTransaction({
      type: 'expense',
      amount: 450,
      accountId: account.id,
      categoryId: expenseCat.id,
      fromAccountId: null,
      toAccountId: null,
      goalId: null,
      note: null,
      date: JUNE_2026_15,
      paid: true,
    });

    const summary = await getPeriodSummary(start, end);
    expect(summary.income).toBe(2000);
    expect(summary.expense).toBe(450);
    expect(summary.net).toBe(1550);
  });
});
