import type { SQLiteDatabase } from 'expo-sqlite';

export function migrateSettings(sqlite: SQLiteDatabase): void {
  sqlite.execSync(`
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`);
}
