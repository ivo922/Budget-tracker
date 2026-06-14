import { differenceInDays, format } from 'date-fns';
import { formatCurrency } from '@/lib/format';
import type { GoalProgress, GoalTimelinePoint } from '@/lib/db/queries';

export type GoalPaceStatus = 'on_track' | 'ahead' | 'behind' | 'completed' | 'no_date';

export type GoalPaceInfo = {
  status: GoalPaceStatus;
  label: string;
  dueLabel?: string;
  requiredPerMonth?: number;
  actualPerMonth?: number;
};

export function computeGoalPace(
  progress: GoalProgress,
  timeline: GoalTimelinePoint[],
): GoalPaceInfo {
  const { goal, remaining } = progress;

  if (goal.status === 'completed') {
    return { status: 'completed', label: 'Completed' };
  }

  if (!goal.targetDate) {
    return { status: 'no_date', label: '' };
  }

  const dueLabel = `Due ${format(new Date(goal.targetDate), 'MMM yyyy')}`;
  const daysLeft = Math.max(1, differenceInDays(new Date(goal.targetDate), new Date()));
  const monthsLeft = Math.max(daysLeft / 30, 1 / 30);
  const requiredPerMonth = remaining / monthsLeft;

  const recentBuckets = timeline.filter((p) => p.contribution !== 0).slice(-3);
  const recentTotal = recentBuckets.reduce((sum, p) => sum + p.contribution, 0);
  const actualPerMonth =
    recentBuckets.length > 0 ? recentTotal / recentBuckets.length : 0;

  if (actualPerMonth >= requiredPerMonth * 0.95) {
    if (actualPerMonth > requiredPerMonth * 1.1) {
      return {
        status: 'ahead',
        label: 'Ahead of pace',
        dueLabel,
        requiredPerMonth,
        actualPerMonth,
      };
    }
    return {
      status: 'on_track',
      label: 'On track',
      dueLabel,
      requiredPerMonth,
      actualPerMonth,
    };
  }

  const behind = Math.max(0, requiredPerMonth - actualPerMonth);
  return {
    status: 'behind',
    label: `Behind by ${formatCurrency(behind)}/mo`,
    dueLabel,
    requiredPerMonth,
    actualPerMonth,
  };
}
