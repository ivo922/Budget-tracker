import { computeGoalPace } from './goalPace';
import type { GoalProgress, GoalTimelinePoint } from '@/lib/db/queries';
import type { Goal } from '@/lib/db/schema';

function makeProgress(overrides: Partial<Goal> & { remaining?: number }): GoalProgress {
  const goal: Goal = {
    id: 'goal-1',
    name: 'Vacation',
    type: 'savings',
    targetAmount: 1000,
    startingBalance: 0,
    targetDate: new Date('2026-12-31').getTime(),
    accountId: null,
    status: 'active',
    createdAt: Date.now(),
    ...overrides,
  };
  const remaining = overrides.remaining ?? 600;
  return { goal, progress: goal.targetAmount - remaining, remaining, percent: 40 };
}

describe('computeGoalPace', () => {
  it('returns completed for completed goals', () => {
    const result = computeGoalPace(makeProgress({ status: 'completed' }), []);
    expect(result.status).toBe('completed');
    expect(result.label).toBe('Completed');
  });

  it('returns no_date when target date missing', () => {
    const result = computeGoalPace(makeProgress({ targetDate: null }), []);
    expect(result.status).toBe('no_date');
  });

  it('returns on_track when recent pace meets requirement', () => {
    const timeline: GoalTimelinePoint[] = [
      { date: '2026-04-01', cumulative: 100, contribution: 100 },
      { date: '2026-05-01', cumulative: 200, contribution: 100 },
      { date: '2026-06-01', cumulative: 300, contribution: 100 },
    ];
    const result = computeGoalPace(makeProgress({ remaining: 600 }), timeline);
    expect(result.status).toBe('on_track');
    expect(result.label).toBe('On track');
  });

  it('returns behind when recent pace is low', () => {
    const timeline: GoalTimelinePoint[] = [
      { date: '2026-06-01', cumulative: 10, contribution: 10 },
    ];
    const result = computeGoalPace(makeProgress({ remaining: 900 }), timeline);
    expect(result.status).toBe('behind');
    expect(result.label).toContain('Behind');
  });

  it('returns ahead when recent pace exceeds requirement', () => {
    const timeline: GoalTimelinePoint[] = [
      { date: '2026-04-01', cumulative: 500, contribution: 500 },
      { date: '2026-05-01', cumulative: 1000, contribution: 500 },
      { date: '2026-06-01', cumulative: 1500, contribution: 500 },
    ];
    const result = computeGoalPace(makeProgress({ remaining: 200 }), timeline);
    expect(result.status).toBe('ahead');
    expect(result.label).toBe('Ahead of pace');
  });
});
