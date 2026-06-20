import * as Crypto from 'expo-crypto';
import { and, asc, eq } from 'drizzle-orm';
import { getDb } from '../index';
import { budgets, type Budget, type NewBudget } from '../schema';
import { getCategories } from './categories';
import { getSpendingByCategory } from './transactions';
import type { BudgetVsActual, BudgetVsActualItem } from './types';

export async function getBudgetsForMonth(year: number, month: number): Promise<Budget[]> {
  const db = getDb();
  return db
    .select()
    .from(budgets)
    .where(and(eq(budgets.year, year), eq(budgets.month, month)))
    .orderBy(asc(budgets.createdAt));
}

export async function upsertBudget(
  categoryId: string,
  year: number,
  month: number,
  plannedAmount: number,
): Promise<Budget> {
  const db = getDb();
  const existing = await db
    .select()
    .from(budgets)
    .where(
      and(
        eq(budgets.categoryId, categoryId),
        eq(budgets.year, year),
        eq(budgets.month, month),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(budgets)
      .set({ plannedAmount })
      .where(eq(budgets.id, existing[0].id));
    return { ...existing[0], plannedAmount };
  }

  const row: NewBudget = {
    id: Crypto.randomUUID(),
    categoryId,
    year,
    month,
    plannedAmount,
    createdAt: Date.now(),
  };
  await db.insert(budgets).values(row);
  return row as Budget;
}

export async function deleteBudget(id: string): Promise<void> {
  const db = getDb();
  await db.delete(budgets).where(eq(budgets.id, id));
}

export async function deleteBudgetForCategory(
  categoryId: string,
  year: number,
  month: number,
): Promise<void> {
  const db = getDb();
  await db
    .delete(budgets)
    .where(
      and(
        eq(budgets.categoryId, categoryId),
        eq(budgets.year, year),
        eq(budgets.month, month),
      ),
    );
}

export async function copyBudgetsFromMonth(
  fromYear: number,
  fromMonth: number,
  toYear: number,
  toMonth: number,
): Promise<number> {
  const source = await getBudgetsForMonth(fromYear, fromMonth);
  for (const row of source) {
    await upsertBudget(row.categoryId, toYear, toMonth, row.plannedAmount);
  }
  return source.length;
}

export async function getBudgetVsActual(
  year: number,
  month: number,
  start: number,
  end: number,
): Promise<BudgetVsActual> {
  const [budgetRows, spending] = await Promise.all([
    getBudgetsForMonth(year, month),
    getSpendingByCategory(start, end),
  ]);

  const spentByCategory = new Map(spending.map((s) => [s.categoryId, s.total]));
  const allCategories = await getCategories('expense');
  const categoryMap = new Map(allCategories.map((c) => [c.id, c]));

  const items: BudgetVsActualItem[] = budgetRows.map((b) => {
    const cat = categoryMap.get(b.categoryId);
    return {
      categoryId: b.categoryId,
      categoryName: cat?.name ?? 'Category',
      color: cat?.color ?? '#6750A4',
      planned: b.plannedAmount,
      spent: spentByCategory.get(b.categoryId) ?? 0,
    };
  });

  const totalPlanned = items.reduce((s, i) => s + i.planned, 0);
  const totalSpent = items.reduce((s, i) => s + i.spent, 0);
  const overBudgetCount = items.filter((i) => i.planned > 0 && i.spent > i.planned).length;

  return { totalPlanned, totalSpent, overBudgetCount, items };
}
