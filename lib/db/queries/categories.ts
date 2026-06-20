import * as Crypto from 'expo-crypto';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { getDb } from '../index';
import { categories, transactions, type Category, type NewCategory } from '../schema';

export async function getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
  const db = getDb();
  if (type) {
    return db.select().from(categories).where(eq(categories.type, type)).orderBy(asc(categories.sortOrder));
  }
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function getParentCategories(type?: 'income' | 'expense'): Promise<Category[]> {
  const db = getDb();
  const condition = type
    ? and(isNull(categories.parentId), eq(categories.type, type))
    : isNull(categories.parentId);
  return db.select().from(categories).where(condition).orderBy(asc(categories.sortOrder));
}

export async function getSubcategories(parentId: string): Promise<Category[]> {
  const db = getDb();
  return db
    .select()
    .from(categories)
    .where(eq(categories.parentId, parentId))
    .orderBy(asc(categories.sortOrder));
}

export async function getCategoryById(id: string): Promise<Category | undefined> {
  const db = getDb();
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return rows[0];
}

export async function createCategory(data: Omit<NewCategory, 'id'>): Promise<Category> {
  const db = getDb();
  const row: NewCategory = { id: Crypto.randomUUID(), ...data };
  await db.insert(categories).values(row);
  return row as Category;
}

export async function updateCategory(
  id: string,
  data: Partial<Omit<NewCategory, 'id'>>,
): Promise<void> {
  const db = getDb();
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: string): Promise<{ ok: boolean; reason?: string }> {
  const db = getDb();
  const [txCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.categoryId, id));

  if (Number(txCount?.count ?? 0) > 0) {
    return { ok: false, reason: 'Category has linked transactions' };
  }

  const children = await getSubcategories(id);
  if (children.length > 0) {
    return { ok: false, reason: 'Delete subcategories first' };
  }

  await db.delete(categories).where(eq(categories.id, id));
  return { ok: true };
}
