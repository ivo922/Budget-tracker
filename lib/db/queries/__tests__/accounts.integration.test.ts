import { initTestDatabase, resetTestDb } from '@/lib/db/testing';
import {
  createAccount,
  deleteAccountWithOptions,
  getAccountBalance,
  getAccountDeletePreview,
  getAccounts,
  updateAccount,
} from '@/lib/db/queries/accounts';
import { createTestAccount } from '@/lib/db/testing/fixtures';

beforeEach(async () => {
  await initTestDatabase();
});

afterEach(() => {
  resetTestDb();
});

describe('accounts CRUD', () => {
  it('createAccount persists and increments sortOrder', async () => {
    const first = await createAccount({ name: 'Checking', color: '#111', initialBalance: 100 });
    const second = await createAccount({ name: 'Savings', color: '#222', initialBalance: 0 });

    const all = await getAccounts();
    expect(all.map((a) => a.name)).toEqual(['Checking', 'Savings']);
    expect(first.sortOrder).toBe(0);
    expect(second.sortOrder).toBe(1);
  });

  it('getAccountBalance returns initialBalance with no transactions', async () => {
    const account = await createTestAccount('Wallet', 250);
    expect(await getAccountBalance(account.id)).toBe(250);
  });

  it('updateAccount changes name and color', async () => {
    const account = await createTestAccount('Old');
    await updateAccount(account.id, { name: 'New', color: '#ABCDEF' });
    const updated = (await getAccounts()).find((a) => a.id === account.id);
    expect(updated?.name).toBe('New');
    expect(updated?.color).toBe('#ABCDEF');
  });

  it('deleteAccountWithOptions removes empty account', async () => {
    await createTestAccount('Keep');
    const doomed = await createTestAccount('Remove');
    const result = await deleteAccountWithOptions(doomed.id);
    expect(result.ok).toBe(true);
    expect((await getAccounts()).map((a) => a.name)).toEqual(['Keep']);
  });

  it('deleteAccountWithOptions requires destination when balance is positive', async () => {
    await createTestAccount('Dest', 0);
    const funded = await createTestAccount('Funded', 500);
    const result = await deleteAccountWithOptions(funded.id);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('destination account');
  });

  it('getAccountDeletePreview blocks when only account remains', async () => {
    const only = await createTestAccount('Only');
    const preview = await getAccountDeletePreview(only.id);
    expect(preview?.canDelete).toBe(false);
    expect(preview?.blockReason).toContain('another account');
  });
});
