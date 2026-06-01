import * as Crypto from 'expo-crypto';
import { subMonths, startOfMonth } from 'date-fns';
import { count } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { ACCOUNT_COLORS } from '@/lib/colors';
import { accounts, categories, transactions, type Category, type NewTransaction } from './schema';
import * as schema from './schema';

type AppDatabase = ExpoSQLiteDatabase<typeof schema>;

const MONTHS_BACK = 5;
const TRANSACTIONS_PER_MONTH = 20;

const EXPENSE_NOTES = [
  'BILLA',
  'Spotify',
  'Shell',
  'Amazon',
  'Netflix',
  'Uber',
  'Pharmacy',
  'Coffee shop',
  'Gym',
  'Electric bill',
  'Haircut',
  'Bookstore',
  'Pizza delivery',
  'Public transit',
  'Hardware store',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAmount(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function pick<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function randomTimestampInMonth(year: number, month: number): number {
  const day = randomInt(1, 28);
  const hour = randomInt(8, 22);
  const minute = randomInt(0, 59);
  return new Date(year, month - 1, day, hour, minute).getTime();
}

async function ensureAccounts(db: AppDatabase): Promise<{ id: string }[]> {
  const existing = await db.select({ id: accounts.id }).from(accounts);
  if (existing.length >= 2) return existing;

  const now = Date.now();
  const toCreate: { id: string; name: string; color: string; initialBalance: number; createdAt: number }[] =
    [];

  if (existing.length === 0) {
    toCreate.push(
      { id: Crypto.randomUUID(), name: 'Checking', color: ACCOUNT_COLORS[0], initialBalance: 2500, createdAt: now },
      { id: Crypto.randomUUID(), name: 'Savings', color: ACCOUNT_COLORS[4], initialBalance: 8000, createdAt: now },
    );
  } else {
    toCreate.push({
      id: Crypto.randomUUID(),
      name: 'Savings',
      color: ACCOUNT_COLORS[4],
      initialBalance: 5000,
      createdAt: now,
    });
  }

  await db.insert(accounts).values(toCreate);
  return db.select({ id: accounts.id }).from(accounts);
}

function pickExpenseCategories(all: Category[]): Category[] {
  const children = all.filter((c) => c.type === 'expense' && c.parentId);
  return children.length > 0 ? children : all.filter((c) => c.type === 'expense');
}

function pickIncomeCategories(all: Category[]): Category[] {
  const children = all.filter((c) => c.type === 'income' && c.parentId);
  return children.length > 0 ? children : all.filter((c) => c.type === 'income');
}

function findCategoryByName(cats: Category[], name: string): Category | undefined {
  return cats.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

type DraftTransaction = Omit<NewTransaction, 'id' | 'createdAt' | 'goalId'>;

function buildMonthTransactions(
  year: number,
  month: number,
  accountIds: string[],
  expenseCats: Category[],
  incomeCats: Category[],
  paycheckCat: Category,
): DraftTransaction[] {
  const rows: DraftTransaction[] = [];
  const checking = accountIds[0];
  const savings = accountIds[1] ?? accountIds[0];

  rows.push({
    type: 'income',
    amount: randomAmount(2800, 4200),
    accountId: checking,
    categoryId: paycheckCat.id,
    fromAccountId: null,
    toAccountId: null,
    note: 'Paycheck',
    date: randomTimestampInMonth(year, month),
  });

  if (Math.random() > 0.35) {
    const freelance = findCategoryByName(incomeCats, 'Freelance') ?? pick(incomeCats);
    rows.push({
      type: 'income',
      amount: randomAmount(150, 900),
      accountId: checking,
      categoryId: freelance.id,
      fromAccountId: null,
      toAccountId: null,
      note: 'Freelance project',
      date: randomTimestampInMonth(year, month),
    });
  }

  if (accountIds.length >= 2) {
    rows.push({
      type: 'transfer',
      amount: randomAmount(200, 600),
      accountId: null,
      categoryId: null,
      fromAccountId: checking,
      toAccountId: savings,
      note: 'Monthly savings',
      date: randomTimestampInMonth(year, month),
    });
  }

  const expenseTarget = TRANSACTIONS_PER_MONTH - rows.length;
  for (let i = 0; i < expenseTarget; i++) {
    const cat = pick(expenseCats);
    rows.push({
      type: 'expense',
      amount: randomAmount(4, 180),
      accountId: Math.random() > 0.85 ? savings : checking,
      categoryId: cat.id,
      fromAccountId: null,
      toAccountId: null,
      note: pick(EXPENSE_NOTES),
      date: randomTimestampInMonth(year, month),
    });
  }

  return rows;
}

/**
 * Inserts ~20 transactions per month for the last 5 months when the DB has no transactions.
 */
export async function seedDummyDataIfNeeded(db: AppDatabase): Promise<void> {
  const [{ value: txCount }] = await db.select({ value: count() }).from(transactions);
  if (txCount > 0) return;

  const accountRows = await ensureAccounts(db);
  const accountIds = accountRows.map((a) => a.id);
  if (accountIds.length === 0) return;

  const allCategories = await db.select().from(categories);
  const expenseCats = pickExpenseCategories(allCategories);
  const incomeCats = pickIncomeCategories(allCategories);
  if (expenseCats.length === 0 || incomeCats.length === 0) return;

  const paycheckCat =
    findCategoryByName(incomeCats, 'Paycheck') ??
    findCategoryByName(allCategories, 'Salary') ??
    pick(incomeCats);

  const now = new Date();
  const createdAt = Date.now();
  const batch: NewTransaction[] = [];

  for (let offset = MONTHS_BACK - 1; offset >= 0; offset--) {
    const monthDate = startOfMonth(subMonths(now, offset));
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth() + 1;

    const monthRows = buildMonthTransactions(
      year,
      month,
      accountIds,
      expenseCats,
      incomeCats,
      paycheckCat,
    );

    for (const row of monthRows) {
      batch.push({
        id: Crypto.randomUUID(),
        createdAt,
        goalId: null,
        ...row,
      });
    }
  }

  const chunkSize = 50;
  for (let i = 0; i < batch.length; i += chunkSize) {
    await db.insert(transactions).values(batch.slice(i, i + chunkSize));
  }
}
