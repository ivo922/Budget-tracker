import { startOfMonth, endOfMonth } from 'date-fns';
import { initTestDatabase, resetTestDb } from '@/lib/db/testing';
import {
  copyBudgetsFromMonth,
  deleteBudgetForCategory,
  getBudgetVsActual,
  getBudgetsForMonth,
  upsertBudget,
} from '@/lib/db/queries/budgets';
import { createTransaction } from '@/lib/db/queries/transactions';
import { createTestAccount, getFirstExpenseCategory, JUNE_2026_15 } from '@/lib/db/testing/fixtures';

const YEAR = 2026;
const MONTH = 6;

beforeEach(async () => {
  await initTestDatabase();
});

afterEach(() => {
  resetTestDb();
});

describe('budgets CRUD', () => {
  it('upsertBudget creates then updates planned amount', async () => {
    const category = await getFirstExpenseCategory();
    const created = await upsertBudget(category.id, YEAR, MONTH, 400);
    expect(created.plannedAmount).toBe(400);

    const updated = await upsertBudget(category.id, YEAR, MONTH, 550);
    expect(updated.plannedAmount).toBe(550);

    const rows = await getBudgetsForMonth(YEAR, MONTH);
    expect(rows).toHaveLength(1);
    expect(rows[0].plannedAmount).toBe(550);
  });

  it('getBudgetVsActual reflects planned and spent amounts', async () => {
    const category = await getFirstExpenseCategory();
    const account = await createTestAccount('Budget acct', 1000);
    await upsertBudget(category.id, YEAR, MONTH, 500);

    await createTransaction({
      type: 'expense',
      amount: 120,
      accountId: account.id,
      categoryId: category.id,
      fromAccountId: null,
      toAccountId: null,
      goalId: null,
      note: null,
      date: JUNE_2026_15,
      paid: true,
    });

    const start = startOfMonth(new Date(JUNE_2026_15)).getTime();
    const end = endOfMonth(new Date(JUNE_2026_15)).getTime();
    const vs = await getBudgetVsActual(YEAR, MONTH, start, end);
    const item = vs.items.find((i) => i.categoryId === category.id);

    expect(item?.planned).toBe(500);
    expect(item?.spent).toBe(120);
    expect(vs.totalPlanned).toBe(500);
    expect(vs.totalSpent).toBe(120);
  });

  it('deleteBudgetForCategory removes planned amount', async () => {
    const category = await getFirstExpenseCategory();
    await upsertBudget(category.id, YEAR, MONTH, 300);
    await deleteBudgetForCategory(category.id, YEAR, MONTH);
    expect(await getBudgetsForMonth(YEAR, MONTH)).toHaveLength(0);
  });

  it('copyBudgetsFromMonth copies planned amounts to target month', async () => {
    const category = await getFirstExpenseCategory();
    await upsertBudget(category.id, YEAR, MONTH, 250);
    const copied = await copyBudgetsFromMonth(YEAR, MONTH, YEAR, MONTH + 1);
    expect(copied).toBe(1);

    const july = await getBudgetsForMonth(YEAR, 7);
    expect(july[0].plannedAmount).toBe(250);
    expect(july[0].categoryId).toBe(category.id);
  });
});
