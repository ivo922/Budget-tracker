import * as Crypto from 'expo-crypto';
import { and, asc, eq, or, sql, sum } from 'drizzle-orm';
import { ALL_ACCOUNTS_SLIDE_ID } from '@/lib/accountCarousel';
import { getDb } from '../index';
import { accounts, settings, transactions, type Account, type NewAccount } from '../schema';
import {
  deleteGoal,
  getActiveGoalByAccountId,
  isAccountLinkedToActiveGoal,
  syncGoalCompletion,
  updateGoal,
} from './goals';
import type {
  AccountDeletePreview,
  DeleteAccountOptions,
  DeleteAccountResult,
} from './types';

export async function getAccounts(): Promise<Account[]> {
  const db = getDb();
  return db
    .select()
    .from(accounts)
    .orderBy(asc(accounts.sortOrder), asc(accounts.name));
}

const ACCOUNT_CAROUSEL_ORDER_KEY = 'account_carousel_order';

export async function getAccountCarouselOrder(): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.key, ACCOUNT_CAROUSEL_ORDER_KEY))
    .limit(1);
  const saved = rows[0]?.value;
  if (!saved) {
    const accountRows = await getAccounts();
    return [ALL_ACCOUNTS_SLIDE_ID, ...accountRows.map((account) => account.id)];
  }
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.map(String) : [ALL_ACCOUNTS_SLIDE_ID];
  } catch {
    return [ALL_ACCOUNTS_SLIDE_ID];
  }
}

export async function reorderAccountCarousel(orderedIds: string[]): Promise<void> {
  const db = getDb();
  const accountIds = orderedIds.filter((id) => id !== ALL_ACCOUNTS_SLIDE_ID);
  await db
    .insert(settings)
    .values({ key: ACCOUNT_CAROUSEL_ORDER_KEY, value: JSON.stringify(orderedIds) })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: JSON.stringify(orderedIds) },
    });
  for (let i = 0; i < accountIds.length; i++) {
    await db.update(accounts).set({ sortOrder: i }).where(eq(accounts.id, accountIds[i]));
  }
}

export async function getAccountById(id: string): Promise<Account | undefined> {
  const db = getDb();
  const rows = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
  return rows[0];
}

export async function createAccount(data: Omit<NewAccount, 'id' | 'createdAt'>): Promise<Account> {
  const db = getDb();
  const existing = await getAccounts();
  const maxOrder = existing.reduce((max, account) => Math.max(max, account.sortOrder), -1);
  const row: NewAccount = {
    id: Crypto.randomUUID(),
    createdAt: Date.now(),
    ...data,
    sortOrder: data.sortOrder ?? maxOrder + 1,
  };
  await db.insert(accounts).values(row);
  return row as Account;
}

export async function updateAccount(
  id: string,
  data: Partial<Omit<NewAccount, 'id' | 'createdAt'>>,
): Promise<void> {
  const db = getDb();
  await db.update(accounts).set(data).where(eq(accounts.id, id));
}

async function deleteAccount(id: string): Promise<void> {
  const db = getDb();
  await db
    .delete(transactions)
    .where(
      or(
        eq(transactions.accountId, id),
        eq(transactions.fromAccountId, id),
        eq(transactions.toAccountId, id),
      ),
    );
  await db.delete(accounts).where(eq(accounts.id, id));
}

export async function countTransactionsForAccount(accountId: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(
      or(
        eq(transactions.accountId, accountId),
        eq(transactions.fromAccountId, accountId),
        eq(transactions.toAccountId, accountId),
      ),
    );
  return Number(rows[0]?.count ?? 0);
}

export async function migrateAccountBalance(fromId: string, toId: string): Promise<void> {
  const balance = await getAccountBalance(fromId);
  if (balance === 0) return;
  const dest = await getAccountById(toId);
  if (!dest) throw new Error('Destination account not found');
  await updateAccount(toId, { initialBalance: dest.initialBalance + balance });
}

export async function getAccountDeletePreview(accountId: string): Promise<AccountDeletePreview | null> {
  const account = await getAccountById(accountId);
  if (!account) return null;

  const [balance, txCount, allAccounts, linkedGoal] = await Promise.all([
    getAccountBalance(accountId),
    countTransactionsForAccount(accountId),
    getAccounts(),
    getActiveGoalByAccountId(accountId),
  ]);

  const otherAccounts = allAccounts.filter((a) => a.id !== accountId);
  let blockReason: string | null = null;

  if (otherAccounts.length === 0) {
    blockReason = 'Create another account before deleting this one.';
  } else if (balance < 0) {
    blockReason = 'Resolve the negative balance before deleting this account.';
  }

  return {
    account,
    balance,
    txCount,
    linkedGoal: linkedGoal ?? null,
    otherAccounts,
    canDelete: blockReason === null,
    blockReason,
  };
}

export async function deleteAccountWithOptions(
  id: string,
  options: DeleteAccountOptions = {},
): Promise<DeleteAccountResult> {
  const preview = await getAccountDeletePreview(id);
  if (!preview) return { ok: false, reason: 'Account not found' };
  if (!preview.canDelete) {
    return { ok: false, reason: preview.blockReason ?? 'Cannot delete account' };
  }

  const { balance, linkedGoal } = preview;

  if (balance > 0) {
    if (!options.transferToAccountId) {
      return { ok: false, reason: 'Select a destination account for remaining funds.' };
    }
    if (options.transferToAccountId === id) {
      return { ok: false, reason: 'Destination account must be different.' };
    }
    const dest = await getAccountById(options.transferToAccountId);
    if (!dest) return { ok: false, reason: 'Destination account not found.' };
    await migrateAccountBalance(id, options.transferToAccountId);
  }

  if (linkedGoal) {
    const handling = options.goalHandling;
    if (!handling) {
      return { ok: false, reason: 'Choose what to do with the linked savings goal.' };
    }

    if (handling === 'reassign') {
      const reassignTo = options.goalReassignToAccountId ?? options.transferToAccountId;
      if (!reassignTo) {
        return { ok: false, reason: 'Select an account to reassign the savings goal to.' };
      }
      if (reassignTo === id) {
        return { ok: false, reason: 'Goal must be reassigned to a different account.' };
      }
      const dest = await getAccountById(reassignTo);
      if (!dest) return { ok: false, reason: 'Reassign destination account not found.' };
      const conflict = await isAccountLinkedToActiveGoal(reassignTo, linkedGoal.id);
      if (conflict) {
        return { ok: false, reason: 'Destination account already has an active savings goal.' };
      }
      await updateGoal(linkedGoal.id, { accountId: reassignTo });
    } else if (handling === 'unlink') {
      await updateGoal(linkedGoal.id, { accountId: null });
    } else if (handling === 'delete') {
      await deleteGoal(linkedGoal.id);
    }
  }

  const db = getDb();
  const affectedTxs = await db
    .select({ goalId: transactions.goalId })
    .from(transactions)
    .where(
      or(
        eq(transactions.accountId, id),
        eq(transactions.fromAccountId, id),
        eq(transactions.toAccountId, id),
      ),
    );
  const affectedGoalIds = [
    ...new Set(affectedTxs.map((r) => r.goalId).filter((gid): gid is string => gid != null)),
  ];

  await deleteAccount(id);

  for (const goalId of affectedGoalIds) {
    await syncGoalCompletion(goalId);
  }

  return { ok: true };
}

export async function getTotalNetBalance(): Promise<number> {
  const accts = await getAccounts();
  let total = 0;
  for (const account of accts) {
    total += await getAccountBalance(account.id);
  }
  return total;
}

export async function getAccountBalance(accountId: string): Promise<number> {
  const db = getDb();
  const account = await getAccountById(accountId);
  if (!account) return 0;

  const [incomeRow] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(
      and(
        eq(transactions.accountId, accountId),
        eq(transactions.type, 'income'),
        eq(transactions.paid, true),
      ),
    );

  const [expenseRow] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(
      and(
        eq(transactions.accountId, accountId),
        eq(transactions.type, 'expense'),
        eq(transactions.paid, true),
      ),
    );

  const [transferInRow] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(eq(transactions.toAccountId, accountId), eq(transactions.type, 'transfer')));

  const [transferOutRow] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(eq(transactions.fromAccountId, accountId), eq(transactions.type, 'transfer')));

  const income = Number(incomeRow?.total ?? 0);
  const expense = Number(expenseRow?.total ?? 0);
  const transferIn = Number(transferInRow?.total ?? 0);
  const transferOut = Number(transferOutRow?.total ?? 0);

  return account.initialBalance + income + transferIn - expense - transferOut;
}
