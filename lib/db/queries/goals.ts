import * as Crypto from 'expo-crypto';
import { differenceInMonths, endOfMonth, format, startOfMonth, startOfWeek } from 'date-fns';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { getDb } from '../index';
import { goals, transactions, type Goal, type NewGoal, type Transaction, type TransactionType } from '../schema';
import {
  getGoalContributingTransactions,
  linkedAccountTxCondition,
  signedGoalContribution,
} from './helpers';
import type { GoalProgress, GoalStats, GoalTimelinePoint, SetGoalLinkedAccountResult } from './types';
import { MS_PER_DAY, TIMELINE_WEEK_BUCKET_DAYS } from './types';

export async function getGoals(status?: Goal['status']): Promise<Goal[]> {
  const db = getDb();
  if (status) {
    return db.select().from(goals).where(eq(goals.status, status)).orderBy(desc(goals.createdAt));
  }
  return db.select().from(goals).orderBy(desc(goals.createdAt));
}

export async function getActiveGoals(): Promise<Goal[]> {
  return getGoals('active');
}

export async function getGoalById(id: string): Promise<Goal | undefined> {
  const db = getDb();
  const rows = await db.select().from(goals).where(eq(goals.id, id)).limit(1);
  return rows[0];
}

export async function getActiveGoalByAccountId(accountId: string): Promise<Goal | undefined> {
  const db = getDb();
  const rows = await db
    .select()
    .from(goals)
    .where(
      and(
        eq(goals.accountId, accountId),
        eq(goals.status, 'active'),
        eq(goals.type, 'savings'),
      ),
    )
    .limit(1);
  return rows[0];
}

export async function isAccountLinkedToActiveGoal(
  accountId: string,
  excludeGoalId?: string,
): Promise<boolean> {
  const goal = await getActiveGoalByAccountId(accountId);
  if (!goal) return false;
  if (excludeGoalId && goal.id === excludeGoalId) return false;
  return true;
}

export async function resolveGoalIdForTransaction(params: {
  accountId?: string | null;
  type: TransactionType;
  manualGoalId?: string | null;
}): Promise<string | null> {
  if (params.type === 'transfer' || !params.accountId) {
    return params.manualGoalId ?? null;
  }

  const linkedGoal = await getActiveGoalByAccountId(params.accountId);
  if (linkedGoal?.type === 'savings') return linkedGoal.id;

  return params.manualGoalId ?? null;
}

export async function resolveGoalIdForTransfer(params: {
  fromAccountId?: string | null;
  toAccountId?: string | null;
  manualGoalId?: string | null;
}): Promise<string | null> {
  const toGoal = params.toAccountId
    ? await getActiveGoalByAccountId(params.toAccountId)
    : undefined;
  if (toGoal?.type === 'savings') return toGoal.id;

  const fromGoal = params.fromAccountId
    ? await getActiveGoalByAccountId(params.fromAccountId)
    : undefined;
  if (fromGoal?.type === 'savings') return fromGoal.id;

  return params.manualGoalId ?? null;
}

export async function countBackfillableTransactions(goalId: string): Promise<number> {
  const goal = await getGoalById(goalId);
  if (!goal?.accountId || goal.type !== 'savings') return 0;

  const db = getDb();
  const rows = await db
    .select()
    .from(transactions)
    .where(and(linkedAccountTxCondition(goal.accountId), isNull(transactions.goalId)));
  return rows.length;
}

export async function backfillGoalTransactions(goalId: string): Promise<number> {
  const goal = await getGoalById(goalId);
  if (!goal?.accountId || goal.type !== 'savings') return 0;

  const db = getDb();
  const rows = await db
    .select()
    .from(transactions)
    .where(and(linkedAccountTxCondition(goal.accountId), isNull(transactions.goalId)));

  for (const tx of rows) {
    await db.update(transactions).set({ goalId }).where(eq(transactions.id, tx.id));
  }

  if (rows.length > 0) await syncGoalCompletion(goalId);
  return rows.length;
}

export async function getGoalTransactions(goalId: string): Promise<Transaction[]> {
  const goal = await getGoalById(goalId);
  if (!goal) return [];
  return getGoalContributingTransactions(goal);
}

export async function getGoalProgress(goalId: string): Promise<GoalProgress | null> {
  const db = getDb();
  const [goal] = await db.select().from(goals).where(eq(goals.id, goalId)).limit(1);
  if (!goal) return null;

  const linkedTxs = await getGoalContributingTransactions(goal);

  const linked = linkedTxs.reduce((sum, tx) => sum + signedGoalContribution(tx, goal), 0);
  const progress = goal.startingBalance + linked;
  const remaining = Math.max(0, goal.targetAmount - progress);
  const percent = goal.targetAmount > 0 ? Math.min(100, (progress / goal.targetAmount) * 100) : 0;

  return { goal, progress, remaining, percent };
}

export async function getGoalContributionTimeline(goalId: string): Promise<GoalTimelinePoint[]> {
  const progress = await getGoalProgress(goalId);
  if (!progress) return [];

  const linkedTxs = [...(await getGoalContributingTransactions(progress.goal))].sort((a, b) => {
    if (a.date !== b.date) return a.date - b.date;
    return a.createdAt - b.createdAt;
  });

  const contributions = linkedTxs
    .map((tx) => ({
      date: tx.date,
      contribution: signedGoalContribution(tx, progress.goal),
    }))
    .filter((p) => p.contribution !== 0);

  if (contributions.length === 0) {
    return [
      {
        date: format(new Date(progress.goal.createdAt), 'yyyy-MM-dd'),
        cumulative: progress.goal.startingBalance,
        contribution: 0,
      },
    ];
  }

  const spanDays =
    (contributions[contributions.length - 1].date - contributions[0].date) / MS_PER_DAY;
  const bucketByWeek = spanDays > TIMELINE_WEEK_BUCKET_DAYS;

  const buckets = new Map<string, number>();
  for (const { date, contribution } of contributions) {
    const key = bucketByWeek
      ? format(startOfWeek(new Date(date)), 'yyyy-MM-dd')
      : format(new Date(date), 'yyyy-MM-dd');
    buckets.set(key, (buckets.get(key) ?? 0) + contribution);
  }

  const sortedKeys = [...buckets.keys()].sort();
  const points: GoalTimelinePoint[] = [
    {
      date: sortedKeys[0],
      cumulative: progress.goal.startingBalance,
      contribution: 0,
    },
  ];

  let cumulative = progress.goal.startingBalance;
  for (const key of sortedKeys) {
    const contribution = buckets.get(key) ?? 0;
    cumulative += contribution;
    points.push({ date: key, cumulative, contribution });
  }

  return points;
}

export async function getGoalsWithProgress(status?: Goal['status']): Promise<GoalProgress[]> {
  const rows = status ? await getGoals(status) : await getGoals();
  const results = await Promise.all(rows.map((g) => getGoalProgress(g.id)));
  return results.filter((r): r is GoalProgress => r !== null);
}

export async function getActiveGoalsWithProgress(limit?: number): Promise<GoalProgress[]> {
  const rows = await getGoalsWithProgress('active');
  if (limit !== undefined) {
    return rows.slice(0, limit);
  }
  return rows;
}

export async function getGoalStats(goalId: string): Promise<GoalStats | null> {
  const progress = await getGoalProgress(goalId);
  if (!progress) return null;

  const txs = await getGoalContributingTransactions(progress.goal);
  const now = new Date();
  const monthStart = startOfMonth(now).getTime();
  const monthEnd = endOfMonth(now).getTime();

  let thisMonthContribution = 0;
  let totalFromTxs = 0;
  for (const tx of txs) {
    const signed = signedGoalContribution(tx, progress.goal);
    totalFromTxs += signed;
    if (tx.date >= monthStart && tx.date <= monthEnd) {
      thisMonthContribution += signed;
    }
  }

  const monthsSinceCreation = Math.max(
    1,
    differenceInMonths(now, new Date(progress.goal.createdAt)) + 1,
  );

  return {
    startingBalance: progress.goal.startingBalance,
    thisMonthContribution,
    averageMonthlyContribution: totalFromTxs / monthsSinceCreation,
    transactionCount: txs.length,
  };
}

export async function saveGoalUpdates(
  id: string,
  data: Partial<Omit<NewGoal, 'id' | 'createdAt'>>,
): Promise<void> {
  await updateGoal(id, data);
  await syncGoalCompletion(id);
}

export async function archiveGoal(id: string): Promise<void> {
  await updateGoal(id, { status: 'archived' });
}

export async function createGoal(data: Omit<NewGoal, 'id' | 'createdAt' | 'status'>): Promise<Goal> {
  const db = getDb();
  const row: NewGoal = {
    id: Crypto.randomUUID(),
    createdAt: Date.now(),
    status: 'active',
    ...data,
    accountId: data.type === 'loan' ? null : (data.accountId ?? null),
  };
  await db.insert(goals).values(row);
  return row as Goal;
}

export async function updateGoal(
  id: string,
  data: Partial<Omit<NewGoal, 'id' | 'createdAt'>>,
): Promise<void> {
  const db = getDb();
  await db.update(goals).set(data).where(eq(goals.id, id));
}

export async function setGoalLinkedAccount(
  goalId: string,
  accountId: string | null,
): Promise<SetGoalLinkedAccountResult> {
  const goal = await getGoalById(goalId);
  if (!goal) return { ok: false, reason: 'Goal not found' };
  if (goal.type !== 'savings') {
    return { ok: false, reason: 'Only savings goals can link an account' };
  }
  if (accountId && (await isAccountLinkedToActiveGoal(accountId, goalId))) {
    return { ok: false, reason: 'This account is already linked to another active goal' };
  }

  await updateGoal(goalId, { accountId });
  await syncGoalCompletion(goalId);
  return { ok: true };
}

export async function deleteGoal(id: string): Promise<void> {
  const db = getDb();
  await db.update(transactions).set({ goalId: null }).where(eq(transactions.goalId, id));
  await db.delete(goals).where(eq(goals.id, id));
}

export async function syncGoalCompletion(goalId: string): Promise<void> {
  const progress = await getGoalProgress(goalId);
  if (!progress) return;

  if (progress.goal.status === 'active' && progress.progress >= progress.goal.targetAmount) {
    await updateGoal(goalId, { status: 'completed' });
  } else if (progress.goal.status === 'completed' && progress.progress < progress.goal.targetAmount) {
    await updateGoal(goalId, { status: 'active' });
  }
}

export async function syncGoalsForLinkedAccounts(
  ...accountIds: (string | null | undefined)[]
): Promise<void> {
  const seen = new Set<string>();
  for (const accountId of accountIds) {
    if (!accountId || seen.has(accountId)) continue;
    seen.add(accountId);
    const goal = await getActiveGoalByAccountId(accountId);
    if (goal) await syncGoalCompletion(goal.id);
  }
}
