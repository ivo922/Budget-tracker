import {
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';

export type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

export type DashboardPeriod =
  | 'this_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'last_year'
  | 'all_time';

export type PeriodRange = {
  start: number;
  end: number;
  label: string;
};

export type CustomRange = {
  startDate: Date;
  endDate: Date;
};

export function getPeriodRange(
  period: PeriodType,
  referenceDate: Date = new Date(),
  custom?: CustomRange,
): PeriodRange {
  switch (period) {
    case 'day':
      return {
        start: startOfDay(referenceDate).getTime(),
        end: endOfDay(referenceDate).getTime(),
        label: 'Today',
      };
    case 'week':
      return {
        start: startOfWeek(referenceDate, { weekStartsOn: 1 }).getTime(),
        end: endOfWeek(referenceDate, { weekStartsOn: 1 }).getTime(),
        label: 'This week',
      };
    case 'month':
      return {
        start: startOfMonth(referenceDate).getTime(),
        end: endOfMonth(referenceDate).getTime(),
        label: 'This month',
      };
    case 'year':
      return {
        start: startOfYear(referenceDate).getTime(),
        end: endOfYear(referenceDate).getTime(),
        label: 'This year',
      };
    case 'custom':
      if (!custom) throw new Error('Custom period requires start and end dates');
      return {
        start: startOfDay(custom.startDate).getTime(),
        end: endOfDay(custom.endDate).getTime(),
        label: 'Custom range',
      };
  }
}

export const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

export const DASHBOARD_PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_3_months', label: 'Last 3 months' },
  { value: 'last_6_months', label: 'Last 6 months' },
  { value: 'last_year', label: 'Last year' },
  { value: 'all_time', label: 'All time' },
];

export function getDashboardPeriodRange(
  period: DashboardPeriod,
  referenceDate: Date = new Date(),
): PeriodRange {
  const option = DASHBOARD_PERIOD_OPTIONS.find((o) => o.value === period);
  const label = option?.label ?? 'This month';

  switch (period) {
    case 'this_month':
      return getPeriodRange('month', referenceDate);
    case 'last_3_months':
      return {
        start: startOfMonth(subMonths(referenceDate, 2)).getTime(),
        end: endOfMonth(referenceDate).getTime(),
        label,
      };
    case 'last_6_months':
      return {
        start: startOfMonth(subMonths(referenceDate, 5)).getTime(),
        end: endOfMonth(referenceDate).getTime(),
        label,
      };
    case 'last_year':
      return {
        start: startOfMonth(subMonths(referenceDate, 11)).getTime(),
        end: endOfMonth(referenceDate).getTime(),
        label,
      };
    case 'all_time':
      return {
        start: 0,
        end: endOfDay(referenceDate).getTime(),
        label,
      };
  }
}

export function formatBudgetMonth(year: number, month: number): string {
  return format(new Date(year, month - 1, 1), 'MMM yyyy');
}

export function getCalendarMonthRange(year: number, month: number): PeriodRange {
  const date = new Date(year, month - 1, 1);
  return getPeriodRange('month', date);
}

export function shiftCalendarMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function getDaysLeftInMonth(
  year: number,
  month: number,
  referenceDate: Date = new Date(),
): number {
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);
  if (referenceDate < monthStart) {
    return differenceInCalendarDays(monthEnd, monthStart) + 1;
  }
  if (referenceDate > monthEnd) return 0;
  return differenceInCalendarDays(monthEnd, referenceDate) + 1;
}

export function getCurrentCalendarMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export type AnalyticsPeriod =
  | PeriodType
  | 'last_3_months'
  | 'last_6_months'
  | 'last_year'
  | 'all_time';

export const ANALYTICS_QUICK_PERIODS: { value: PeriodType; label: string }[] = PERIOD_OPTIONS;

export const ANALYTICS_EXTENDED_PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'last_3_months', label: 'Last 3 months' },
  { value: 'last_6_months', label: 'Last 6 months' },
  { value: 'last_year', label: 'Last year' },
  { value: 'all_time', label: 'All time' },
];

export function getAnalyticsPeriodRange(
  period: AnalyticsPeriod,
  referenceDate: Date = new Date(),
): PeriodRange {
  if (period === 'last_3_months' || period === 'last_6_months' || period === 'last_year' || period === 'all_time') {
    return getDashboardPeriodRange(period, referenceDate);
  }
  return getPeriodRange(period, referenceDate);
}

export function formatAnalyticsPeriodSpan(range: PeriodRange): string {
  if (range.start === 0) {
    return `${range.label} · through ${format(new Date(range.end), 'MMM d, yyyy')}`;
  }
  const start = new Date(range.start);
  const end = new Date(range.end);
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${range.label} · ${format(start, 'MMM d')}–${format(end, 'd, yyyy')}`;
  }
  if (sameYear) {
    return `${range.label} · ${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  }
  return `${range.label} · ${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
}

export function getPreviousAnalyticsPeriodRange(
  period: AnalyticsPeriod,
  referenceDate: Date = new Date(),
): PeriodRange | null {
  switch (period) {
    case 'day': {
      const range = getPeriodRange('day', subDays(referenceDate, 1));
      return { ...range, label: 'Yesterday' };
    }
    case 'week': {
      const range = getPeriodRange('week', subWeeks(referenceDate, 1));
      return { ...range, label: 'Last week' };
    }
    case 'month': {
      const range = getPeriodRange('month', subMonths(referenceDate, 1));
      return { ...range, label: 'Last month' };
    }
    case 'year': {
      const range = getPeriodRange('year', subYears(referenceDate, 1));
      return { ...range, label: 'Last year' };
    }
    case 'last_3_months': {
      const range = getAnalyticsPeriodRange('last_3_months', subMonths(referenceDate, 3));
      return { ...range, label: 'Prior 3 months' };
    }
    case 'last_6_months': {
      const range = getAnalyticsPeriodRange('last_6_months', subMonths(referenceDate, 6));
      return { ...range, label: 'Prior 6 months' };
    }
    case 'last_year': {
      const range = getAnalyticsPeriodRange('last_year', subMonths(referenceDate, 12));
      return { ...range, label: 'Prior 12 months' };
    }
    case 'all_time':
      return null;
    case 'custom':
      return null;
  }
}

export function isTrendPeriod(period: AnalyticsPeriod): boolean {
  return period === 'week' || period === 'month';
}
