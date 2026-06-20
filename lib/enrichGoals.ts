import type { GoalProgress } from '@/lib/db/queries';
import { getAccountBalance, getAccountById, getGoalContributionTimeline } from '@/lib/db/queries';
import { computeGoalPace, type GoalPaceInfo } from '@/lib/goalPace';

export type GoalListItem = GoalProgress & {
  pace: GoalPaceInfo;
  linkedAccountName?: string;
  linkedAccountBalance?: number;
  paceLabel?: string;
  dueLabel?: string;
};

export async function enrichGoalListItem(item: GoalProgress): Promise<GoalListItem> {
  const timeline = await getGoalContributionTimeline(item.goal.id);
  const pace = computeGoalPace(item, timeline);
  let linkedAccountName: string | undefined;
  let linkedAccountBalance: number | undefined;
  if (item.goal.accountId && item.goal.type === 'savings') {
    const account = await getAccountById(item.goal.accountId);
    if (account) {
      linkedAccountName = account.name;
      linkedAccountBalance = await getAccountBalance(account.id);
    }
  }
  return {
    ...item,
    pace,
    linkedAccountName,
    linkedAccountBalance,
    paceLabel: pace.label || undefined,
    dueLabel: pace.dueLabel,
  };
}

if (__DEV__) {
  enrichGoalListItem({
    goal: {
      id: 'g',
      name: 'Test',
      type: 'savings',
      status: 'active',
      targetAmount: 100,
      startingBalance: 0,
      targetDate: null,
      accountId: null,
      createdAt: Date.now(),
    },
    progress: 0,
    remaining: 100,
    percent: 0,
  }).then((row) => console.assert(row.pace.status === 'no_date'));
}
