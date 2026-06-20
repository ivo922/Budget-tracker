import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { MIGRATION_SQL } from './migrations/init';
import { migrateAccountSortOrder } from './migrations/accountSortOrder';
import { migrateSettings } from './migrations/settings';
import { migrateTransactionPaid } from './migrations/transactionPaid';
import { seedCategoriesIfNeeded } from './seed';
import { seedDummyDataIfNeeded } from './seedDummyData';
import * as schema from './schema';

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!dbInstance) {
    const sqlite = openDatabaseSync('budget-tracker.db');
    sqlite.execSync(MIGRATION_SQL);
    migrateAccountSortOrder(sqlite);
    migrateSettings(sqlite);
    migrateTransactionPaid(sqlite);
    dbInstance = drizzle(sqlite, { schema });
  }
  return dbInstance;
}

export async function initDatabase(): Promise<void> {
  const db = getDb();
  await seedCategoriesIfNeeded(db);
  await seedDummyDataIfNeeded(db);
}

export type AppDatabase = ReturnType<typeof getDb>;
