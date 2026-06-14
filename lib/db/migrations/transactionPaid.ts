import type { SQLiteDatabase } from 'expo-sqlite';

export function migrateTransactionPaid(sqlite: SQLiteDatabase): void {
  const columns = sqlite.getAllSync<{ name: string }>('PRAGMA table_info(transactions)');
  if (columns.some((col) => col.name === 'paid')) return;

  sqlite.execSync('ALTER TABLE transactions ADD COLUMN paid INTEGER NOT NULL DEFAULT 1');
}
