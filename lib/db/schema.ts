import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#6750A4'),
  initialBalance: real('initial_balance').notNull().default(0),
  createdAt: integer('created_at').notNull(),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  parentId: text('parent_id'),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  color: text('color').notNull().default('#6750A4'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const goals = sqliteTable('goals', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['loan', 'savings'] }).notNull(),
  targetAmount: real('target_amount').notNull(),
  startingBalance: real('starting_balance').notNull().default(0),
  targetDate: integer('target_date'),
  accountId: text('account_id'),
  status: text('status', { enum: ['active', 'completed', 'archived'] })
    .notNull()
    .default('active'),
  createdAt: integer('created_at').notNull(),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['income', 'expense', 'transfer'] }).notNull(),
  amount: real('amount').notNull(),
  accountId: text('account_id'),
  categoryId: text('category_id'),
  fromAccountId: text('from_account_id'),
  toAccountId: text('to_account_id'),
  goalId: text('goal_id'),
  note: text('note'),
  date: integer('date').notNull(),
  createdAt: integer('created_at').notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Goal = typeof goals.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type TransactionType = 'income' | 'expense' | 'transfer';
export type CategoryType = 'income' | 'expense';
export type GoalType = 'loan' | 'savings';
