import { MUTED_GRAY } from '@/lib/colors';
import type { Goal, Transaction, TransactionType } from '@/lib/db/schema';

export type TransactionFilters = {
  accountId?: string;
  type?: TransactionType;
  categoryId?: string;
  uncategorized?: boolean;
  paid?: boolean;
  start?: number;
  end?: number;
  limit?: number;
};

export type PeriodSummary = {
  income: number;
  expense: number;
  net: number;
};

export type CategorySpending = {
  categoryId: string;
  categoryName: string;
  color: string;
  total: number;
  parentId: string | null;
};

export const UNCATEGORIZED_CATEGORY_ID = '__uncategorized__';
export const UNCATEGORIZED_COLOR = MUTED_GRAY;

export type GoalProgress = {
  goal: Goal;
  progress: number;
  remaining: number;
  percent: number;
};

export type GoalTimelinePoint = {
  date: string;
  cumulative: number;
  contribution: number;
};

export type GoalStats = {
  startingBalance: number;
  thisMonthContribution: number;
  averageMonthlyContribution: number;
  transactionCount: number;
};

export type BudgetVsActualItem = {
  categoryId: string;
  categoryName: string;
  color: string;
  planned: number;
  spent: number;
};

export type BudgetVsActual = {
  totalPlanned: number;
  totalSpent: number;
  overBudgetCount: number;
  items: BudgetVsActualItem[];
};

export type AccountDeletePreview = {
  account: import('@/lib/db/schema').Account;
  balance: number;
  txCount: number;
  linkedGoal: Goal | null;
  otherAccounts: import('@/lib/db/schema').Account[];
  canDelete: boolean;
  blockReason: string | null;
};

export type DeleteAccountOptions = {
  transferToAccountId?: string;
  goalHandling?: 'reassign' | 'unlink' | 'delete';
  goalReassignToAccountId?: string;
};

export type DeleteAccountResult = { ok: true } | { ok: false; reason: string };

export type SetGoalLinkedAccountResult = { ok: true } | { ok: false; reason: string };

export const MS_PER_DAY = 86_400_000;
export const TIMELINE_WEEK_BUCKET_DAYS = 90;
