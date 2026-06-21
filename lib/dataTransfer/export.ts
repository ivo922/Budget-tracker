import { getDb } from '@/lib/db/index';
import {
  accounts,
  budgets,
  categories,
  goals,
  settings,
  transactions,
} from '@/lib/db/schema';
import type { BackupFile } from './types';

export async function buildBackup(): Promise<BackupFile> {
  const db = getDb();
  const [
    accountRows,
    categoryRows,
    goalRows,
    transactionRows,
    budgetRows,
    settingRows,
  ] = await Promise.all([
    db.select().from(accounts),
    db.select().from(categories),
    db.select().from(goals),
    db.select().from(transactions),
    db.select().from(budgets),
    db.select().from(settings),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    accounts: accountRows,
    categories: categoryRows,
    goals: goalRows,
    transactions: transactionRows,
    budgets: budgetRows,
    settings: settingRows,
  };
}

export function serializeBackup(backup: BackupFile): string {
  return JSON.stringify(backup);
}
