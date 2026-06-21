import type { Budget } from '@/lib/db/schema';

export type MergeAction = 'insert' | 'update' | 'skip';

export function mergeAction<T extends { id: string; createdAt: number }>(
  local: T | undefined,
  incoming: T,
): MergeAction {
  if (!local) return 'insert';
  if (local.createdAt >= incoming.createdAt) return 'skip';
  return 'update';
}

export function budgetNaturalKey(b: Pick<Budget, 'categoryId' | 'year' | 'month'>): string {
  return `${b.categoryId}:${b.year}:${b.month}`;
}

if (__DEV__) {
  console.assert(mergeAction(undefined, { id: '1', createdAt: 1 }) === 'insert');
  console.assert(mergeAction({ id: '1', createdAt: 2 }, { id: '1', createdAt: 1 }) === 'skip');
  console.assert(mergeAction({ id: '1', createdAt: 1 }, { id: '1', createdAt: 2 }) === 'update');
  console.assert(budgetNaturalKey({ categoryId: 'c', year: 2026, month: 3 }) === 'c:2026:3');
}
