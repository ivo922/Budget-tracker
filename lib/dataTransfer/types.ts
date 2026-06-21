import type {
  Account,
  Budget,
  Category,
  Goal,
  Transaction,
} from '@/lib/db/schema';

export type SettingRow = { key: string; value: string };

export type BackupFile = {
  version: 1;
  exportedAt: string;
  accounts: Account[];
  categories: Category[];
  goals: Goal[];
  transactions: Transaction[];
  budgets: Budget[];
  settings: SettingRow[];
};

export type TableCounts = {
  accounts: number;
  categories: number;
  goals: number;
  transactions: number;
  budgets: number;
  settings: number;
};

export type ImportSummary = {
  inserted: TableCounts;
  updated: TableCounts;
  skipped: TableCounts;
  warnings: string[];
};

export function emptyTableCounts(): TableCounts {
  return {
    accounts: 0,
    categories: 0,
    goals: 0,
    transactions: 0,
    budgets: 0,
    settings: 0,
  };
}

export function emptyImportSummary(): ImportSummary {
  return {
    inserted: emptyTableCounts(),
    updated: emptyTableCounts(),
    skipped: emptyTableCounts(),
    warnings: [],
  };
}
