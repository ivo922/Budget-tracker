import * as Crypto from 'expo-crypto';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { categories } from './schema';
import type { CategoryType } from './schema';
import * as schema from './schema';

type AppDatabase = ExpoSQLiteDatabase<typeof schema>;

const DEFAULT_CATEGORIES: {
  name: string;
  type: CategoryType;
  color: string;
  children?: { name: string }[];
}[] = [
  {
    name: 'Food',
    type: 'expense',
    color: '#E65100',
    children: [{ name: 'Groceries' }, { name: 'Restaurants' }],
  },
  {
    name: 'Housing',
    type: 'expense',
    color: '#1565C0',
    children: [{ name: 'Rent' }, { name: 'Utilities' }],
  },
  {
    name: 'Entertainment',
    type: 'expense',
    color: '#6A1B9A',
    children: [{ name: 'Going out' }, { name: 'Streaming' }],
  },
  {
    name: 'Transport',
    type: 'expense',
    color: '#00838F',
    children: [{ name: 'Fuel' }, { name: 'Public transit' }],
  },
  { name: 'Health', type: 'expense', color: '#C62828' },
  { name: 'Shopping', type: 'expense', color: '#AD1457' },
  { name: 'Other', type: 'expense', color: '#546E7A' },
  {
    name: 'Salary',
    type: 'income',
    color: '#2E7D32',
    children: [{ name: 'Paycheck' }],
  },
  { name: 'Freelance', type: 'income', color: '#558B2F' },
  { name: 'Other', type: 'income', color: '#689F38' },
];

export async function seedCategoriesIfNeeded(db: AppDatabase): Promise<void> {
  const existing = await db.select().from(categories).limit(1);
  if (existing.length > 0) return;

  let sortOrder = 0;
  for (const parent of DEFAULT_CATEGORIES) {
    const parentId = Crypto.randomUUID();
    await db.insert(categories).values({
      id: parentId,
      name: parent.name,
      parentId: null,
      type: parent.type,
      color: parent.color,
      sortOrder: sortOrder++,
    });

    for (const child of parent.children ?? []) {
      await db.insert(categories).values({
        id: Crypto.randomUUID(),
        name: child.name,
        parentId,
        type: parent.type,
        color: parent.color,
        sortOrder: sortOrder++,
      });
    }
  }
}

export async function isSeeded(db: AppDatabase): Promise<boolean> {
  const rows = await db.select().from(categories).limit(1);
  return rows.length > 0;
}

export async function markSeeded(db: AppDatabase): Promise<void> {
  await seedCategoriesIfNeeded(db);
}
