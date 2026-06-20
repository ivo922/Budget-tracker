import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { MIGRATION_SQL } from './migrations/init';
import { seedCategoriesIfNeeded } from './seed';
import * as schema from './schema';
import { resetTestDb, setTestDb, type AppDatabase } from './index.native';

export type TestDatabase = AppDatabase;

function migrateTestDatabase(sqlite: Database.Database): void {
  sqlite.exec(MIGRATION_SQL);
  sqlite.exec(`
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`);
}

export async function initTestDatabase(): Promise<TestDatabase> {
  resetTestDb();
  const sqlite = new Database(':memory:');
  migrateTestDatabase(sqlite);
  const db = drizzle(sqlite, { schema }) as unknown as TestDatabase;
  setTestDb(db);
  await seedCategoriesIfNeeded(db as Parameters<typeof seedCategoriesIfNeeded>[0]);
  return db;
}

export { resetTestDb };
