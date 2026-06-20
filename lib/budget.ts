import { formatCurrency } from '@/lib/format';

export type BudgetStatus = {
  remaining: number;
  overBudget: boolean;
  progress: number;
  percent: number;
};

export function computeBudgetStatus(planned: number, spent: number): BudgetStatus {
  const remaining = planned - spent;
  const overBudget = planned > 0 && spent > planned;
  const progress = planned > 0 ? Math.min(1, spent / planned) : 0;
  const percent = planned > 0 ? Math.round((spent / planned) * 100) : 0;
  return { remaining, overBudget, progress, percent };
}

export type BudgetLabelVariant = 'row' | 'hero' | 'short';

export function formatBudgetRemainingLabel(
  status: BudgetStatus,
  variant: BudgetLabelVariant = 'row',
): string {
  const { remaining, overBudget, percent } = status;
  if (overBudget) {
    const over = formatCurrency(Math.abs(remaining));
    if (variant === 'row') return `${over} over · ${percent}%`;
    if (variant === 'hero') return `${over} over budget`;
    return `${over} over budget`;
  }
  const left = formatCurrency(remaining);
  if (variant === 'row') return `${left} left · ${percent}%`;
  if (variant === 'hero') return `${left} remaining`;
  return `${left} left`;
}

if (__DEV__) {
  const s = computeBudgetStatus(100, 120);
  console.assert(s.overBudget && s.percent === 120 && s.remaining === -20);
  console.assert(formatBudgetRemainingLabel(s, 'row').includes('over'));
}
