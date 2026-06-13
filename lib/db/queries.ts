import * as Crypto from 'expo-crypto';
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  or,
  sql,
  sum,
} from 'drizzle-orm';
import { getDb } from './index';
import {
  accounts,
  budgets,
  categories,
  goals,
  transactions,
  type Account,
  type Budget,
  type Category,
  type Goal,
  type NewAccount,
  type NewBudget,
  type NewCategory,
  type NewGoal,
  type NewTransaction,
  type Transaction,
  type TransactionType,
} from './schema';

export type TransactionFilters = {
  accountId?: string;
  type?: TransactionType;
  categoryId?: string;
  start?: number;
  end?: number;
  limit?: number;
};

export type PeriodSummary = {
  income: number;
  expense: number;
  net: number;
};

export type CategorySpending = {
  categoryId: string;
  categoryName: string;
  color: string;
  total: number;
  parentId: string | null;
};

export type GoalProgress = {
  goal: Goal;
  progress: number;
  remaining: number;
  percent: number;
};

export type BudgetVsActualItem = {
  categoryId: string;
  categoryName: string;
  color: string;
  planned: number;
  spent: number;
};

export type BudgetVsActual = {
  totalPlanned: number;
  totalSpent: number;
  overBudgetCount: number;
  items: BudgetVsActualItem[];
};

export async function getAccounts(): Promise<Account[]> {
  const db = getDb();
  return db.select().from(accounts).orderBy(asc(accounts.name));
}

export async function getAccountById(id: string): Promise<Account | undefined> {
  const db = getDb();
  const rows = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
  return rows[0];
}

export async function createAccount(data: Omit<NewAccount, 'id' | 'createdAt'>): Promise<Account> {
  const db = getDb();
  const row: NewAccount = {
    id: Crypto.randomUUID(),
    createdAt: Date.now(),
    ...data,
  };
  await db.insert(accounts).values(row);
  return row as Account;
}

export async function updateAccount(
  id: string,
  data: Partial<Omit<NewAccount, 'id' | 'createdAt'>>,
): Promise<void> {
  const db = getDb();
  await db.update(accounts).set(data).where(eq(accounts.id, id));
}

export async function deleteAccount(id: string): Promise<void> {
  const db = getDb();
  await db
    .delete(transactions)
    .where(
      or(
        eq(transactions.accountId, id),
        eq(transactions.fromAccountId, id),
        eq(transactions.toAccountId, id),
      ),
    );
  await db.delete(accounts).where(eq(accounts.id, id));
}

export async function getTotalNetBalance(): Promise<number> {
  const accts = await getAccounts();
  let total = 0;
  for (const account of accts) {
    total += await getAccountBalance(account.id);
  }
  return total;
}

export async function getAccountBalance(accountId: string): Promise<number> {
  const db = getDb();
  const account = await getAccountById(accountId);
  if (!account) return 0;

  const [incomeRow] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(eq(transactions.accountId, accountId), eq(transactions.type, 'income')));

  const [expenseRow] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(eq(transactions.accountId, accountId), eq(transactions.type, 'expense')));

  const [transferInRow] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(eq(transactions.toAccountId, accountId), eq(transactions.type, 'transfer')));

  const [transferOutRow] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(eq(transactions.fromAccountId, accountId), eq(transactions.type, 'transfer')));

  const income = Number(incomeRow?.total ?? 0);
  const expense = Number(expenseRow?.total ?? 0);
  const transferIn = Number(transferInRow?.total ?? 0);
  const transferOut = Number(transferOutRow?.total ?? 0);

  return account.initialBalance + income + transferIn - expense - transferOut;
}

export async function getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
  const db = getDb();
  if (type) {
    return db.select().from(categories).where(eq(categories.type, type)).orderBy(asc(categories.sortOrder));
  }
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function getParentCategories(type?: 'income' | 'expense'): Promise<Category[]> {
  const db = getDb();
  const condition = type
    ? and(isNull(categories.parentId), eq(categories.type, type))
    : isNull(categories.parentId);
  return db.select().from(categories).where(condition).orderBy(asc(categories.sortOrder));
}

export async function getSubcategories(parentId: string): Promise<Category[]> {
  const db = getDb();
  return db
    .select()
    .from(categories)
    .where(eq(categories.parentId, parentId))
    .orderBy(asc(categories.sortOrder));
}

export async function getCategoryById(id: string): Promise<Category | undefined> {
  const db = getDb();
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return rows[0];
}

export async function createCategory(
  data: Omit<NewCategory, 'id'>,
): Promise<Category> {
  const db = getDb();
  const row: NewCategory = { id: Crypto.randomUUID(), ...data };
  await db.insert(categories).values(row);
  return row as Category;
}

export async function updateCategory(
  id: string,
  data: Partial<Omit<NewCategory, 'id'>>,
): Promise<void> {
  const db = getDb();
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: string): Promise<{ ok: boolean; reason?: string }> {
  const db = getDb();
  const [txCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.categoryId, id));

  if (Number(txCount?.count ?? 0) > 0) {
    return { ok: false, reason: 'Category has linked transactions' };
  }

  const children = await getSubcategories(id);
  if (children.length > 0) {
    return { ok: false, reason: 'Delete subcategories first' };
  }

  await db.delete(categories).where(eq(categories.id, id));
  return { ok: true };
}

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
  if (filters.categoryId) conditions.push(eq(transactions.categoryId, filters.categoryId));
  if (filters.start) conditions.push(gte(transactions.date, filters.start));
  if (filters.end) conditions.push(lte(transactions.date, filters.end));

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
  const row: NewTransaction = {
    id: Crypto.randomUUID(),
    createdAt: Date.now(),
    goalId: null,
    ...data,
  };
  await db.insert(transactions).values(row);
  if (row.goalId) await maybeCompleteGoal(row.goalId);
  return row as Transaction;
}

export async function updateTransaction(
  id: string,
  data: Partial<Omit<NewTransaction, 'id' | 'createdAt'>>,
): Promise<void> {
  const db = getDb();
  await db.update(transactions).set(data).where(eq(transactions.id, id));
  if (data.goalId) await maybeCompleteGoal(data.goalId);
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = getDb();
  await db.delete(transactions).where(eq(transactions.id, id));
}

export async function getPeriodSummary(start: number, end: number): Promise<PeriodSummary> {
  const db = getDb();
  const rows = await db
    .select()
    .from(transactions)
    .where(and(gte(transactions.date, start), lte(transactions.date, end)));

  let income = 0;
  let expense = 0;
  for (const tx of rows) {
    if (tx.type === 'income') income += tx.amount;
    if (tx.type === 'expense') expense += tx.amount;
  }
  return { income, expense, net: income - expense };
}

export async function getSpendingByCategory(
  start: number,
  end: number,
  parentId?: string | null,
): Promise<CategorySpending[]> {
  const db = getDb();
  const expenseTx = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.type, 'expense'),
        gte(transactions.date, start),
        lte(transactions.date, end),
      ),
    );

  const allCategories = await getCategories('expense');
  const categoryMap = new Map(allCategories.map((c) => [c.id, c]));

  const totals = new Map<string, number>();
  for (const tx of expenseTx) {
    if (!tx.categoryId) continue;
    const cat = categoryMap.get(tx.categoryId);
    if (!cat) continue;
    const rollupId = cat.parentId ?? cat.id;
    totals.set(rollupId, (totals.get(rollupId) ?? 0) + tx.amount);
  }

  if (parentId) {
    const subTotals = new Map<string, number>();
    for (const tx of expenseTx) {
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

  return Array.from(totals.entries())
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
}

export async function getDailyExpensesForMonth(year: number, month: number): Promise<{ day: number; total: number }[]> {
  const db = getDb();
  const start = new Date(year, month, 1).getTime();
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
  const rows = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.type, 'expense'),
        gte(transactions.date, start),
        lte(transactions.date, end),
      ),
    );

  const byDay = new Map<number, number>();
  for (const tx of rows) {
    const day = new Date(tx.date).getDate();
    byDay.set(day, (byDay.get(day) ?? 0) + tx.amount);
  }
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    total: byDay.get(i + 1) ?? 0,
  }));
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

export async function getGoals(status?: Goal['status']): Promise<Goal[]> {
  const db = getDb();
  if (status) {
    return db.select().from(goals).where(eq(goals.status, status)).orderBy(desc(goals.createdAt));
  }
  return db.select().from(goals).orderBy(desc(goals.createdAt));
}

export async function getActiveGoals(): Promise<Goal[]> {
  return getGoals('active');
}

export async function getGoalProgress(goalId: string): Promise<GoalProgress | null> {
  const db = getDb();
  const [goal] = await db.select().from(goals).where(eq(goals.id, goalId)).limit(1);
  if (!goal) return null;

  const [row] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(eq(transactions.goalId, goalId));

  const linked = Number(row?.total ?? 0);
  const progress = goal.startingBalance + linked;
  const remaining = Math.max(0, goal.targetAmount - progress);
  const percent = goal.targetAmount > 0 ? Math.min(100, (progress / goal.targetAmount) * 100) : 0;

  return { goal, progress, remaining, percent };
}

export async function getGoalsWithProgress(): Promise<GoalProgress[]> {
  const rows = await getGoals();
  const results = await Promise.all(rows.map((g) => getGoalProgress(g.id)));
  return results.filter((r): r is GoalProgress => r !== null);
}

export async function createGoal(data: Omit<NewGoal, 'id' | 'createdAt' | 'status'>): Promise<Goal> {
  const db = getDb();
  const row: NewGoal = {
    id: Crypto.randomUUID(),
    createdAt: Date.now(),
    status: 'active',
    ...data,
  };
  await db.insert(goals).values(row);
  return row as Goal;
}

export async function updateGoal(
  id: string,
  data: Partial<Omit<NewGoal, 'id' | 'createdAt'>>,
): Promise<void> {
  const db = getDb();
  await db.update(goals).set(data).where(eq(goals.id, id));
}

export async function deleteGoal(id: string): Promise<void> {
  const db = getDb();
  await db.update(transactions).set({ goalId: null }).where(eq(transactions.goalId, id));
  await db.delete(goals).where(eq(goals.id, id));
}

async function maybeCompleteGoal(goalId: string): Promise<void> {
  const progress = await getGoalProgress(goalId);
  if (!progress || progress.goal.status !== 'active') return;
  if (progress.progress >= progress.goal.targetAmount) {
    await updateGoal(goalId, { status: 'completed' });
  }
}

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
