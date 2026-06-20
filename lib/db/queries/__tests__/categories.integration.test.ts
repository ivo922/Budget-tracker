import { initTestDatabase, resetTestDb } from '@/lib/db/testing';
import {
  createCategory,
  deleteCategory,
  getCategories,
  getParentCategories,
  getSubcategories,
} from '@/lib/db/queries/categories';
import { createTransaction } from '@/lib/db/queries/transactions';
import { createTestAccount, getFirstExpenseCategory, JUNE_2026_15 } from '@/lib/db/testing/fixtures';

beforeEach(async () => {
  await initTestDatabase();
});

afterEach(() => {
  resetTestDb();
});

describe('categories CRUD', () => {
  it('seeds default categories on init', async () => {
    const expense = await getParentCategories('expense');
    const income = await getParentCategories('income');
    expect(expense.length).toBeGreaterThan(0);
    expect(income.length).toBeGreaterThan(0);
  });

  it('createCategory builds parent and child hierarchy', async () => {
    const parent = await createCategory({
      name: 'Custom',
      parentId: null,
      type: 'expense',
      color: '#123456',
      sortOrder: 99,
    });
    const child = await createCategory({
      name: 'Sub',
      parentId: parent.id,
      type: 'expense',
      color: '#123456',
      sortOrder: 100,
    });

    const subs = await getSubcategories(parent.id);
    expect(subs.map((c) => c.id)).toContain(child.id);
    expect((await getCategories('expense')).some((c) => c.id === parent.id)).toBe(true);
  });

  it('deleteCategory succeeds when empty', async () => {
    const cat = await createCategory({
      name: 'Disposable',
      parentId: null,
      type: 'expense',
      color: '#000',
      sortOrder: 200,
    });
    const result = await deleteCategory(cat.id);
    expect(result.ok).toBe(true);
    expect((await getCategories()).find((c) => c.id === cat.id)).toBeUndefined();
  });

  it('deleteCategory rejects category with children', async () => {
    const parent = await createCategory({
      name: 'Parent',
      parentId: null,
      type: 'expense',
      color: '#000',
      sortOrder: 201,
    });
    await createCategory({
      name: 'Child',
      parentId: parent.id,
      type: 'expense',
      color: '#000',
      sortOrder: 202,
    });
    const result = await deleteCategory(parent.id);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('subcategories');
  });

  it('deleteCategory rejects category with linked transactions', async () => {
    const account = await createTestAccount('Acct');
    const category = await getFirstExpenseCategory();
    await createTransaction({
      type: 'expense',
      amount: 10,
      accountId: account.id,
      categoryId: category.id,
      fromAccountId: null,
      toAccountId: null,
      goalId: null,
      note: null,
      date: JUNE_2026_15,
      paid: true,
    });
    const result = await deleteCategory(category.id);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('linked transactions');
  });
});
