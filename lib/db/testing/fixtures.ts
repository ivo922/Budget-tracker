import { createAccount } from '@/lib/db/queries/accounts';
import { createCategory, getParentCategories } from '@/lib/db/queries/categories';

export async function createTestAccount(name: string, initialBalance = 0) {
  return createAccount({ name, color: '#6750A4', initialBalance });
}

export async function createTestExpenseCategory(name: string) {
  const parents = await getParentCategories('expense');
  const sortOrder = parents.length;
  return createCategory({
    name,
    parentId: null,
    type: 'expense',
    color: '#546E7A',
    sortOrder,
  });
}

export async function getFirstExpenseCategory() {
  const parents = await getParentCategories('expense');
  const first = parents[0];
  if (!first) throw new Error('No seeded expense categories');
  return first;
}

export async function getFirstIncomeCategory() {
  const parents = await getParentCategories('income');
  const first = parents[0];
  if (!first) throw new Error('No seeded income categories');
  return first;
}

/** Fixed mid-month timestamp for stable budget/period tests. */
export const JUNE_2026_15 = new Date('2026-06-15T12:00:00').getTime();
