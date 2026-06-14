import type { SQLiteDatabase } from 'expo-sqlite';

export function migrateAccountSortOrder(sqlite: SQLiteDatabase): void {
  const columns = sqlite.getAllSync<{ name: string }>('PRAGMA table_info(accounts)');
  if (columns.some((col) => col.name === 'sort_order')) return;

  sqlite.execSync('ALTER TABLE accounts ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0');

  const rows = sqlite.getAllSync<{ id: string }>(
    'SELECT id FROM accounts ORDER BY name ASC, created_at ASC',
  );
  rows.forEach((row, index) => {
    sqlite.runSync('UPDATE accounts SET sort_order = ? WHERE id = ?', index, row.id);
  });
}
