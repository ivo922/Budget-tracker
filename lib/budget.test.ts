import { computeBudgetStatus, formatBudgetRemainingLabel } from './budget';

describe('computeBudgetStatus', () => {
  it('computes under-budget status', () => {
    const s = computeBudgetStatus(100, 60);
    expect(s.remaining).toBe(40);
    expect(s.overBudget).toBe(false);
    expect(s.percent).toBe(60);
    expect(s.progress).toBeCloseTo(0.6);
  });

  it('computes over-budget status', () => {
    const s = computeBudgetStatus(100, 120);
    expect(s.overBudget).toBe(true);
    expect(s.percent).toBe(120);
    expect(s.remaining).toBe(-20);
  });

  it('handles zero planned amount', () => {
    const s = computeBudgetStatus(0, 50);
    expect(s.overBudget).toBe(false);
    expect(s.percent).toBe(0);
    expect(s.progress).toBe(0);
  });
});

describe('formatBudgetRemainingLabel', () => {
  it('formats row, hero, and short variants', () => {
    const over = computeBudgetStatus(100, 120);
    expect(formatBudgetRemainingLabel(over, 'row')).toContain('over');
    expect(formatBudgetRemainingLabel(over, 'hero')).toContain('over budget');

    const under = computeBudgetStatus(100, 40);
    expect(formatBudgetRemainingLabel(under, 'row')).toContain('left');
    expect(formatBudgetRemainingLabel(under, 'hero')).toContain('remaining');
    expect(formatBudgetRemainingLabel(under, 'short')).toContain('left');
  });
});
