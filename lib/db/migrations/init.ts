export const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6750A4',
  initial_balance REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  parent_id TEXT,
  type TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6750A4',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY NOT NULL,
  category_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  planned_amount REAL NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  target_amount REAL NOT NULL,
  starting_balance REAL NOT NULL DEFAULT 0,
  target_date INTEGER,
  account_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  account_id TEXT,
  category_id TEXT,
  from_account_id TEXT,
  to_account_id TEXT,
  goal_id TEXT,
  note TEXT,
  date INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
`;
