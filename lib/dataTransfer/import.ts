import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db/index';
import { syncGoalCompletion } from '@/lib/db/queries/goals';
import {
  accounts,
  budgets,
  categories,
  goals,
  settings,
  transactions,
  type Budget,
  type Category,
  type Transaction,
} from '@/lib/db/schema';
import { budgetNaturalKey, mergeAction } from './merge';
import type { BackupFile, ImportSummary, SettingRow } from './types';
import { emptyImportSummary } from './types';
import { parseBackupJson } from './validate';

function sortCategoriesForInsert(rows: Category[]): Category[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const sorted: Category[] = [];
  const visited = new Set<string>();

  const visit = (row: Category) => {
    if (visited.has(row.id)) return;
    if (row.parentId && byId.has(row.parentId)) visit(byId.get(row.parentId)!);
    visited.add(row.id);
    sorted.push(row);
  };

  for (const row of rows) visit(row);
  return sorted;
}

function hasAccountId(ids: Set<string>, value: string | null | undefined): boolean {
  return value == null || ids.has(value);
}

function transactionRefsValid(
  tx: Transaction,
  accountIds: Set<string>,
  categoryIds: Set<string>,
  goalIds: Set<string>,
): boolean {
  if (!hasAccountId(accountIds, tx.accountId)) return false;
  if (!hasAccountId(accountIds, tx.fromAccountId)) return false;
  if (!hasAccountId(accountIds, tx.toAccountId)) return false;
  if (tx.categoryId != null && !categoryIds.has(tx.categoryId)) return false;
  if (tx.goalId != null && !goalIds.has(tx.goalId)) return false;
  return true;
}

async function mergeCategories(incoming: Category[], summary: ImportSummary): Promise<void> {
  const db = getDb();
  const localRows = await db.select().from(categories);
  const localById = new Map(localRows.map((row) => [row.id, row]));

  for (const row of sortCategoriesForInsert(incoming)) {
    if (localById.has(row.id)) {
      summary.skipped.categories += 1;
      continue;
    }
    if (row.parentId && !localById.has(row.parentId)) {
      summary.warnings.push(`Skipped category "${row.name}": missing parent ${row.parentId}`);
      summary.skipped.categories += 1;
      continue;
    }
    await db.insert(categories).values(row);
    localById.set(row.id, row);
    summary.inserted.categories += 1;
  }
}

async function mergeWithCreatedAt<T extends { id: string; createdAt: number }>(
  table: 'accounts' | 'goals',
  incoming: T[],
  summary: ImportSummary,
  insert: (row: T) => Promise<void>,
  update: (row: T) => Promise<void>,
  loadLocal: () => Promise<Map<string, T>>,
): Promise<void> {
  const localById = await loadLocal();

  for (const row of incoming) {
    const local = localById.get(row.id);
    const action = mergeAction(local, row);
    if (action === 'skip') {
      summary.skipped[table] += 1;
      continue;
    }
    if (action === 'insert') {
      await insert(row);
      localById.set(row.id, row);
      summary.inserted[table] += 1;
      continue;
    }
    await update(row);
    localById.set(row.id, row);
    summary.updated[table] += 1;
  }
}

async function mergeBudgets(incoming: Budget[], summary: ImportSummary): Promise<void> {
  const db = getDb();
  const localById = new Map((await db.select().from(budgets)).map((row) => [row.id, row]));
  const localByKey = new Map(
    [...localById.values()].map((row) => [budgetNaturalKey(row), row]),
  );

  for (const row of incoming) {
    const byId = localById.get(row.id);
    const key = budgetNaturalKey(row);
    const byKey = localByKey.get(key);

    if (byId) {
      const action = mergeAction(byId, row);
      if (action === 'skip') {
        summary.skipped.budgets += 1;
        continue;
      }
      await db.update(budgets).set(row).where(eq(budgets.id, row.id));
      localById.set(row.id, row);
      localByKey.set(key, row);
      summary.updated.budgets += 1;
      continue;
    }

    if (byKey && byKey.id !== row.id) {
      if (byKey.createdAt >= row.createdAt) {
        summary.skipped.budgets += 1;
        continue;
      }
      await db.delete(budgets).where(eq(budgets.id, byKey.id));
      localById.delete(byKey.id);
      localByKey.delete(key);
    }

    await db.insert(budgets).values(row);
    localById.set(row.id, row);
    localByKey.set(key, row);
    summary.inserted.budgets += 1;
  }
}

async function mergeSettings(incoming: SettingRow[], summary: ImportSummary): Promise<void> {
  const db = getDb();
  const localKeys = new Set((await db.select().from(settings)).map((row) => row.key));

  for (const row of incoming) {
    if (localKeys.has(row.key)) {
      summary.skipped.settings += 1;
      continue;
    }
    await db.insert(settings).values(row);
    localKeys.add(row.key);
    summary.inserted.settings += 1;
  }
}

export async function mergeBackup(file: BackupFile): Promise<ImportSummary> {
  const summary = emptyImportSummary();
  const db = getDb();
  const touchedGoalIds = new Set<string>();

  await mergeCategories(file.categories, summary);

  await mergeWithCreatedAt(
    'accounts',
    file.accounts,
    summary,
    async (row) => {
      await db.insert(accounts).values(row);
    },
    async (row) => {
      await db.update(accounts).set(row).where(eq(accounts.id, row.id));
    },
    async () => new Map((await db.select().from(accounts)).map((row) => [row.id, row])),
  );

  await mergeWithCreatedAt(
    'goals',
    file.goals,
    summary,
    async (row) => {
      await db.insert(goals).values(row);
      touchedGoalIds.add(row.id);
    },
    async (row) => {
      await db.update(goals).set(row).where(eq(goals.id, row.id));
      touchedGoalIds.add(row.id);
    },
    async () => new Map((await db.select().from(goals)).map((row) => [row.id, row])),
  );

  const accountIds = new Set((await db.select().from(accounts)).map((row) => row.id));
  const categoryIds = new Set((await db.select().from(categories)).map((row) => row.id));
  const goalIds = new Set((await db.select().from(goals)).map((row) => row.id));
  const localTxById = new Map((await db.select().from(transactions)).map((row) => [row.id, row]));

  for (const row of file.transactions) {
    if (!transactionRefsValid(row, accountIds, categoryIds, goalIds)) {
      summary.warnings.push(`Skipped transaction ${row.id}: unresolved reference`);
      summary.skipped.transactions += 1;
      continue;
    }
    const local = localTxById.get(row.id);
    const action = mergeAction(local, row);
    if (action === 'skip') {
      summary.skipped.transactions += 1;
      continue;
    }
    if (action === 'insert') {
      await db.insert(transactions).values(row);
      localTxById.set(row.id, row);
      summary.inserted.transactions += 1;
    } else {
      await db.update(transactions).set(row).where(eq(transactions.id, row.id));
      localTxById.set(row.id, row);
      summary.updated.transactions += 1;
    }
    if (row.goalId) touchedGoalIds.add(row.goalId);
  }

  await mergeBudgets(file.budgets, summary);
  await mergeSettings(file.settings, summary);

  for (const goalId of touchedGoalIds) {
    await syncGoalCompletion(goalId);
  }

  return summary;
}

export async function importBackupJson(raw: string): Promise<ImportSummary> {
  return mergeBackup(parseBackupJson(raw));
}
