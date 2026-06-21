import { initTestDatabase, resetTestDb } from '@/lib/db/testing';
import { buildBackup, serializeBackup } from '@/lib/dataTransfer/export';
import { mergeBackup } from '@/lib/dataTransfer/import';
import { parseBackupJson } from '@/lib/dataTransfer/validate';
import { getAccounts } from '@/lib/db/queries/accounts';
import { getBudgetsForMonth } from '@/lib/db/queries/budgets';
import { getCategories } from '@/lib/db/queries/categories';
import { createGoal } from '@/lib/db/queries/goals';
import { createTransaction } from '@/lib/db/queries/transactions';
import { getDb } from '@/lib/db/index';
import { budgets, settings } from '@/lib/db/schema';
import {
  createTestAccount,
  createTestExpenseCategory,
  getFirstExpenseCategory,
  JUNE_2026_15,
} from '@/lib/db/testing/fixtures';
import type { BackupFile } from '@/lib/dataTransfer/types';

beforeEach(async () => {
  await initTestDatabase();
});

afterEach(() => {
  resetTestDb();
});

function emptyBackup(overrides: Partial<BackupFile> = {}): BackupFile {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    accounts: [],
    categories: [],
    goals: [],
    transactions: [],
    budgets: [],
    settings: [],
    ...overrides,
  };
}

describe('buildBackup', () => {
  it('includes all tables in export', async () => {
    const account = await createTestAccount('Export acct', 50);
    const category = await getFirstExpenseCategory();
    await createTransaction({
      type: 'expense',
      amount: 10,
      accountId: account.id,
      categoryId: category.id,
      fromAccountId: null,
      toAccountId: null,
      goalId: null,
      note: 'coffee',
      date: JUNE_2026_15,
      paid: true,
    });

    const backup = await buildBackup();
    expect(backup.version).toBe(1);
    expect(backup.accounts.some((row) => row.id === account.id)).toBe(true);
    expect(backup.categories.length).toBeGreaterThan(0);
    expect(backup.transactions.some((row) => row.note === 'coffee')).toBe(true);
  });
});

describe('mergeBackup', () => {
  it('merges disjoint ids from two datasets', async () => {
    const localAccount = await createTestAccount('Local', 100);
    const incoming = emptyBackup({
      accounts: [
        {
          id: 'remote-account-1',
          name: 'Remote',
          color: '#111111',
          initialBalance: 200,
          sortOrder: 5,
          createdAt: JUNE_2026_15,
        },
      ],
    });

    const summary = await mergeBackup(incoming);
    expect(summary.inserted.accounts).toBe(1);
    const names = (await getAccounts()).map((row) => row.name).sort();
    expect(names).toEqual(['Local', 'Remote'].sort());
    expect(names).toContain(localAccount.name);
  });

  it('updates when incoming row has same id and newer createdAt', async () => {
    const account = await createTestAccount('Old name', 0);
    const incoming = emptyBackup({
      accounts: [{ ...account, name: 'New name', createdAt: account.createdAt + 1000 }],
    });

    const summary = await mergeBackup(incoming);
    expect(summary.updated.accounts).toBe(1);
    expect((await getAccounts()).find((row) => row.id === account.id)?.name).toBe('New name');
  });

  it('skips when local row has same id and newer createdAt', async () => {
    const account = await createTestAccount('Keep me', 0);
    const incoming = emptyBackup({
      accounts: [{ ...account, name: 'Replace me', createdAt: account.createdAt - 1000 }],
    });

    const summary = await mergeBackup(incoming);
    expect(summary.skipped.accounts).toBe(1);
    expect((await getAccounts()).find((row) => row.id === account.id)?.name).toBe('Keep me');
  });

  it('dedupes budgets by category/month natural key', async () => {
    const category = await getFirstExpenseCategory();
    const localBudget = {
      id: 'local-budget',
      categoryId: category.id,
      year: 2026,
      month: 6,
      plannedAmount: 100,
      createdAt: 1000,
    };
    const db = getDb();
    await db.insert(budgets).values(localBudget);

    const incoming = emptyBackup({
      budgets: [
        {
          id: 'remote-budget',
          categoryId: category.id,
          year: 2026,
          month: 6,
          plannedAmount: 200,
          createdAt: 2000,
        },
      ],
    });

    const summary = await mergeBackup(incoming);
    expect(summary.inserted.budgets).toBe(1);
    const rows = await getBudgetsForMonth(2026, 6);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('remote-budget');
    expect(rows[0].plannedAmount).toBe(200);
    expect(summary.skipped.budgets).toBe(0);
  });

  it('keeps local category when ids conflict', async () => {
    const category = await getFirstExpenseCategory();
    const incoming = emptyBackup({
      categories: [{ ...category, name: 'Renamed remotely', sortOrder: 99 }],
    });

    const summary = await mergeBackup(incoming);
    expect(summary.skipped.categories).toBe(1);
    expect((await getCategories()).find((row) => row.id === category.id)?.name).toBe(category.name);
  });

  it('skips transactions with unresolved references', async () => {
    const incoming = emptyBackup({
      transactions: [
        {
          id: 'orphan-tx',
          type: 'expense',
          amount: 25,
          accountId: 'missing-account',
          categoryId: null,
          fromAccountId: null,
          toAccountId: null,
          goalId: null,
          note: null,
          date: JUNE_2026_15,
          paid: true,
          createdAt: JUNE_2026_15,
        },
      ],
    });

    const summary = await mergeBackup(incoming);
    expect(summary.skipped.transactions).toBe(1);
    expect(summary.warnings.some((w) => w.includes('orphan-tx'))).toBe(true);
  });

  it('round-trips export onto an empty database', async () => {
    const account = await createTestAccount('Round trip', 300);
    const category = await createTestExpenseCategory('Sync cat');
    await createGoal({
      name: 'Trip fund',
      type: 'savings',
      targetAmount: 1000,
      startingBalance: 0,
      targetDate: null,
      accountId: null,
    });
    await createTransaction({
      type: 'expense',
      amount: 40,
      accountId: account.id,
      categoryId: category.id,
      fromAccountId: null,
      toAccountId: null,
      goalId: null,
      note: 'sync me',
      date: JUNE_2026_15,
      paid: true,
    });

    const exported = await buildBackup();
    const parsed = parseBackupJson(serializeBackup(exported));

    resetTestDb();
    await initTestDatabase();

    const summary = await mergeBackup(parsed);
    expect(summary.inserted.accounts).toBeGreaterThan(0);
    expect(summary.inserted.transactions).toBe(1);
    expect((await getAccounts()).some((row) => row.name === 'Round trip')).toBe(true);
    expect((await buildBackup()).transactions.some((row) => row.note === 'sync me')).toBe(true);
    expect((await getCategories()).some((row) => row.name === 'Sync cat')).toBe(true);
  });

  it('inserts settings only when key is missing', async () => {
    const db = getDb();
    await db.insert(settings).values({ key: 'local_only', value: '"x"' });

    const incoming = emptyBackup({
      settings: [
        { key: 'local_only', value: '"y"' },
        { key: 'imported_only', value: '"z"' },
      ],
    });

    const summary = await mergeBackup(incoming);
    expect(summary.skipped.settings).toBe(1);
    expect(summary.inserted.settings).toBe(1);
    const rows = await db.select().from(settings);
    expect(rows.find((row) => row.key === 'local_only')?.value).toBe('"x"');
    expect(rows.find((row) => row.key === 'imported_only')?.value).toBe('"z"');
  });
});

describe('parseBackupJson', () => {
  it('rejects invalid version', () => {
    expect(() =>
      parseBackupJson(
        JSON.stringify({
          version: 2,
          exportedAt: 'x',
          accounts: [],
          categories: [],
          goals: [],
          transactions: [],
          budgets: [],
          settings: [],
        }),
      ),
    ).toThrow(/version/i);
  });
});
