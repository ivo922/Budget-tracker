import * as Crypto from 'expo-crypto';
import { format, startOfDay } from 'date-fns';
import { and, desc, eq, gte, inArray, isNull, lte, or, sql, sum } from 'drizzle-orm';
import { getDb } from '../index';
import { transactions, type NewTransaction, type Transaction, type TransactionType } from '../schema';
import { getCategories, getSubcategories } from './categories';
import { defaultPaidForDate, rollupCategoryTotals } from './helpers';
import {
  resolveGoalIdForTransaction,
  resolveGoalIdForTransfer,
  syncGoalCompletion,
  syncGoalsForLinkedAccounts,
} from './goals';
import {
  CategorySpending,
  PeriodSummary,
  TransactionFilters,
  UNCATEGORIZED_CATEGORY_ID,
  UNCATEGORIZED_COLOR,
} from './types';

export async function getTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
  const db = getDb();
  const conditions = [];

  if (filters.accountId) {
    conditions.push(
      or(
        eq(transactions.accountId, filters.accountId),
        eq(transactions.fromAccountId, filters.accountId),
        eq(transactions.toAccountId, filters.accountId),
      ),
    );
  }
  if (filters.type) conditions.push(eq(transactions.type, filters.type));
  if (filters.uncategorized) {
    conditions.push(isNull(transactions.categoryId));
  } else if (filters.categoryId) {
    const subs = await getSubcategories(filters.categoryId);
    const ids = [filters.categoryId, ...subs.map((c) => c.id)];
    conditions.push(inArray(transactions.categoryId, ids));
  }
  if (filters.start) conditions.push(gte(transactions.date, filters.start));
  if (filters.end) conditions.push(lte(transactions.date, filters.end));
  if (filters.paid !== undefined) conditions.push(eq(transactions.paid, filters.paid));

  let query = db.select().from(transactions).orderBy(desc(transactions.date), desc(transactions.createdAt));
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }
  const rows = await query;
  return filters.limit ? rows.slice(0, filters.limit) : rows;
}

export async function getTransactionById(id: string): Promise<Transaction | undefined> {
  const db = getDb();
  const rows = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
  return rows[0];
}

export async function createTransaction(
  data: Omit<NewTransaction, 'id' | 'createdAt'>,
): Promise<Transaction> {
  const db = getDb();
  const resolvedGoalId =
    data.type === 'transfer'
      ? await resolveGoalIdForTransfer({
          fromAccountId: data.fromAccountId,
          toAccountId: data.toAccountId,
          manualGoalId: data.goalId,
        })
      : await resolveGoalIdForTransaction({
          accountId: data.accountId,
          type: data.type,
          manualGoalId: data.goalId,
        });
  const row: NewTransaction = {
    ...data,
    id: Crypto.randomUUID(),
    createdAt: Date.now(),
    goalId: resolvedGoalId,
    paid: data.type === 'transfer' ? true : (data.paid ?? defaultPaidForDate(new Date(data.date))),
  };
  await db.insert(transactions).values(row);
  await syncGoalsForLinkedAccounts(data.accountId, data.fromAccountId, data.toAccountId);
  if (row.goalId) await syncGoalCompletion(row.goalId);
  return row as Transaction;
}

export async function updateTransaction(
  id: string,
  data: Partial<Omit<NewTransaction, 'id' | 'createdAt'>>,
): Promise<void> {
  const db = getDb();
  const old = await getTransactionById(id);
  if (!old) return;

  const mergedType = data.type ?? old.type;
  const mergedAccountId = data.accountId !== undefined ? data.accountId : old.accountId;
  const mergedFromAccountId =
    data.fromAccountId !== undefined ? data.fromAccountId : old.fromAccountId;
  const mergedToAccountId = data.toAccountId !== undefined ? data.toAccountId : old.toAccountId;
  const manualGoalId = data.goalId !== undefined ? data.goalId : old.goalId;

  let goalId = manualGoalId;
  if (mergedType === 'transfer') {
    goalId = await resolveGoalIdForTransfer({
      fromAccountId: mergedFromAccountId,
      toAccountId: mergedToAccountId,
      manualGoalId,
    });
  } else if (
    data.accountId !== undefined ||
    data.type !== undefined ||
    data.goalId !== undefined
  ) {
    goalId = await resolveGoalIdForTransaction({
      accountId: mergedAccountId,
      type: mergedType,
      manualGoalId,
    });
  }

  await db
    .update(transactions)
    .set({
      ...data,
      goalId,
      paid: mergedType === 'transfer' ? true : (data.paid ?? old.paid),
    })
    .where(eq(transactions.id, id));

  await syncGoalsForLinkedAccounts(
    old.accountId,
    old.fromAccountId,
    old.toAccountId,
    mergedAccountId,
    mergedFromAccountId,
    mergedToAccountId,
  );
  const affected = new Set([old.goalId, goalId].filter((g): g is string => !!g));
  for (const gid of affected) {
    await syncGoalCompletion(gid);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = getDb();
  const old = await getTransactionById(id);
  await db.delete(transactions).where(eq(transactions.id, id));
  if (!old) return;
  await syncGoalsForLinkedAccounts(old.accountId, old.fromAccountId, old.toAccountId);
  if (old.goalId) await syncGoalCompletion(old.goalId);
}

export async function getPeriodSummary(
  start: number,
  end: number,
  accountId?: string,
): Promise<PeriodSummary> {
  const db = getDb();
  const base = [gte(transactions.date, start), lte(transactions.date, end)];
  if (accountId) {
    base.push(eq(transactions.accountId, accountId));
  }

  const [incomeRow] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(...base, eq(transactions.type, 'income'), eq(transactions.paid, true)));

  const [expenseRow] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(...base, eq(transactions.type, 'expense'), eq(transactions.paid, true)));

  const income = Number(incomeRow?.total ?? 0);
  const expense = Number(expenseRow?.total ?? 0);
  return { income, expense, net: income - expense };
}

async function getAmountByCategory(
  type: Extract<TransactionType, 'income' | 'expense'>,
  start: number,
  end: number,
  parentId?: string | null,
  accountId?: string,
): Promise<CategorySpending[]> {
  const db = getDb();
  const conditions = [
    eq(transactions.type, type),
    eq(transactions.paid, true),
    gte(transactions.date, start),
    lte(transactions.date, end),
  ];
  if (accountId) {
    conditions.push(eq(transactions.accountId, accountId));
  }
  const typedTx = await db.select().from(transactions).where(and(...conditions));

  const allCategories = await getCategories(type);
  const categoryMap = new Map(allCategories.map((c) => [c.id, c]));
  const { totals, uncategorizedTotal } = rollupCategoryTotals(typedTx, categoryMap);

  if (parentId) {
    const subTotals = new Map<string, number>();
    for (const tx of typedTx) {
      if (!tx.categoryId) continue;
      const cat = categoryMap.get(tx.categoryId);
      if (!cat || cat.parentId !== parentId) continue;
      subTotals.set(cat.id, (subTotals.get(cat.id) ?? 0) + tx.amount);
    }
    return Array.from(subTotals.entries())
      .map(([categoryId, total]) => {
        const cat = categoryMap.get(categoryId)!;
        return {
          categoryId,
          categoryName: cat.name,
          color: cat.color,
          total,
          parentId: cat.parentId,
        };
      })
      .sort((a, b) => b.total - a.total);
  }

  const items = Array.from(totals.entries())
    .map(([categoryId, total]) => {
      const cat = categoryMap.get(categoryId)!;
      return {
        categoryId,
        categoryName: cat.name,
        color: cat.color,
        total,
        parentId: cat.parentId,
      };
    })
    .filter((item) => categoryMap.get(item.categoryId)?.parentId === null)
    .sort((a, b) => b.total - a.total);

  if (uncategorizedTotal > 0) {
    items.push({
      categoryId: UNCATEGORIZED_CATEGORY_ID,
      categoryName: 'Uncategorized',
      color: UNCATEGORIZED_COLOR,
      total: uncategorizedTotal,
      parentId: null,
    });
    items.sort((a, b) => b.total - a.total);
  }

  return items;
}

export async function getSpendingByCategory(
  start: number,
  end: number,
  parentId?: string | null,
  accountId?: string,
): Promise<CategorySpending[]> {
  return getAmountByCategory('expense', start, end, parentId, accountId);
}

export async function getIncomeByCategory(
  start: number,
  end: number,
  parentId?: string | null,
  accountId?: string,
): Promise<CategorySpending[]> {
  return getAmountByCategory('income', start, end, parentId, accountId);
}

export async function getDailyTotals(
  start: number,
  end: number,
  type: Extract<TransactionType, 'income' | 'expense'>,
  accountId?: string,
): Promise<{ day: string; total: number }[]> {
  const db = getDb();
  const conditions = [
    eq(transactions.type, type),
    eq(transactions.paid, true),
    gte(transactions.date, start),
    lte(transactions.date, end),
  ];
  if (accountId) {
    conditions.push(eq(transactions.accountId, accountId));
  }
  const rows = await db.select().from(transactions).where(and(...conditions));

  const byDay = new Map<string, number>();
  for (const tx of rows) {
    const key = format(new Date(tx.date), 'yyyy-MM-dd');
    byDay.set(key, (byDay.get(key) ?? 0) + tx.amount);
  }

  const result: { day: string; total: number }[] = [];
  const cursor = startOfDay(new Date(start));
  const endDate = startOfDay(new Date(end));
  while (cursor <= endDate) {
    const key = format(cursor, 'yyyy-MM-dd');
    result.push({ day: key, total: byDay.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export async function countTransactionsForCategory(categoryId: string): Promise<number> {
  const db = getDb();
  const childIds = (await getSubcategories(categoryId)).map((c) => c.id);
  const ids = [categoryId, ...childIds];
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(inArray(transactions.categoryId, ids));
  return Number(row?.count ?? 0);
}
