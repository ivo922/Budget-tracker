import type { BackupFile } from './types';

const TRANSACTION_TYPES = new Set(['income', 'expense', 'transfer']);
const CATEGORY_TYPES = new Set(['income', 'expense']);
const GOAL_TYPES = new Set(['loan', 'savings']);
const GOAL_STATUSES = new Set(['active', 'completed', 'archived']);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value);
}

function expectArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Backup file "${field}" must be an array`);
  }
  return value;
}

function parseAccount(row: unknown, index: number): BackupFile['accounts'][number] {
  if (!isObject(row)) throw new Error(`accounts[${index}] must be an object`);
  const { id, name, color, initialBalance, sortOrder, createdAt } = row;
  if (!isString(id) || !isString(name) || !isString(color)) {
    throw new Error(`accounts[${index}] has invalid id/name/color`);
  }
  if (!isNumber(initialBalance) || !isNumber(sortOrder) || !isNumber(createdAt)) {
    throw new Error(`accounts[${index}] has invalid numeric fields`);
  }
  return { id, name, color, initialBalance, sortOrder, createdAt };
}

function parseCategory(row: unknown, index: number): BackupFile['categories'][number] {
  if (!isObject(row)) throw new Error(`categories[${index}] must be an object`);
  const { id, name, parentId, type, color, sortOrder } = row;
  if (!isString(id) || !isString(name) || !isString(color)) {
    throw new Error(`categories[${index}] has invalid id/name/color`);
  }
  if (!isNullableString(parentId) || !isString(type) || !CATEGORY_TYPES.has(type)) {
    throw new Error(`categories[${index}] has invalid parentId/type`);
  }
  if (!isNumber(sortOrder)) throw new Error(`categories[${index}] has invalid sortOrder`);
  return { id, name, parentId, type: type as 'income' | 'expense', color, sortOrder };
}

function parseGoal(row: unknown, index: number): BackupFile['goals'][number] {
  if (!isObject(row)) throw new Error(`goals[${index}] must be an object`);
  const {
    id,
    name,
    type,
    targetAmount,
    startingBalance,
    targetDate,
    accountId,
    status,
    createdAt,
  } = row;
  if (!isString(id) || !isString(name) || !isString(type) || !GOAL_TYPES.has(type)) {
    throw new Error(`goals[${index}] has invalid id/name/type`);
  }
  if (!isNumber(targetAmount) || !isNumber(startingBalance) || !isNumber(createdAt)) {
    throw new Error(`goals[${index}] has invalid numeric fields`);
  }
  if (targetDate !== null && targetDate !== undefined && !isNumber(targetDate)) {
    throw new Error(`goals[${index}] has invalid targetDate`);
  }
  if (!isNullableString(accountId)) throw new Error(`goals[${index}] has invalid accountId`);
  if (!isString(status) || !GOAL_STATUSES.has(status)) {
    throw new Error(`goals[${index}] has invalid status`);
  }
  return {
    id,
    name,
    type: type as 'loan' | 'savings',
    targetAmount,
    startingBalance,
    targetDate: targetDate ?? null,
    accountId,
    status: status as 'active' | 'completed' | 'archived',
    createdAt,
  };
}

function parseTransaction(row: unknown, index: number): BackupFile['transactions'][number] {
  if (!isObject(row)) throw new Error(`transactions[${index}] must be an object`);
  const {
    id,
    type,
    amount,
    accountId,
    categoryId,
    fromAccountId,
    toAccountId,
    goalId,
    note,
    date,
    paid,
    createdAt,
  } = row;
  if (!isString(id) || !isString(type) || !TRANSACTION_TYPES.has(type)) {
    throw new Error(`transactions[${index}] has invalid id/type`);
  }
  if (!isNumber(amount) || amount <= 0 || !isNumber(date) || !isNumber(createdAt)) {
    throw new Error(`transactions[${index}] has invalid amount/date/createdAt`);
  }
  if (
    !isNullableString(accountId) ||
    !isNullableString(categoryId) ||
    !isNullableString(fromAccountId) ||
    !isNullableString(toAccountId) ||
    !isNullableString(goalId) ||
    !isNullableString(note)
  ) {
    throw new Error(`transactions[${index}] has invalid nullable refs`);
  }
  if (!isBoolean(paid)) throw new Error(`transactions[${index}] has invalid paid`);
  return {
    id,
    type: type as 'income' | 'expense' | 'transfer',
    amount,
    accountId,
    categoryId,
    fromAccountId,
    toAccountId,
    goalId,
    note,
    date,
    paid,
    createdAt,
  };
}

function parseBudget(row: unknown, index: number): BackupFile['budgets'][number] {
  if (!isObject(row)) throw new Error(`budgets[${index}] must be an object`);
  const { id, categoryId, year, month, plannedAmount, createdAt } = row;
  if (!isString(id) || !isString(categoryId)) {
    throw new Error(`budgets[${index}] has invalid id/categoryId`);
  }
  if (!isNumber(year) || !isNumber(month) || !isNumber(plannedAmount) || !isNumber(createdAt)) {
    throw new Error(`budgets[${index}] has invalid numeric fields`);
  }
  return { id, categoryId, year, month, plannedAmount, createdAt };
}

function parseSetting(row: unknown, index: number): BackupFile['settings'][number] {
  if (!isObject(row)) throw new Error(`settings[${index}] must be an object`);
  const { key, value } = row;
  if (!isString(key) || !isString(value)) {
    throw new Error(`settings[${index}] has invalid key/value`);
  }
  return { key, value };
}

export function parseBackupJson(raw: string): BackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Backup file is not valid JSON');
  }
  if (!isObject(parsed)) throw new Error('Backup file must be a JSON object');
  if (parsed.version !== 1) throw new Error('Unsupported backup version');
  if (!isString(parsed.exportedAt)) throw new Error('Backup file missing exportedAt');

  return {
    version: 1,
    exportedAt: parsed.exportedAt,
    accounts: expectArray(parsed.accounts, 'accounts').map(parseAccount),
    categories: expectArray(parsed.categories, 'categories').map(parseCategory),
    goals: expectArray(parsed.goals, 'goals').map(parseGoal),
    transactions: expectArray(parsed.transactions, 'transactions').map(parseTransaction),
    budgets: expectArray(parsed.budgets, 'budgets').map(parseBudget),
    settings: expectArray(parsed.settings, 'settings').map(parseSetting),
  };
}
