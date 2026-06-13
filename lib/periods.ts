import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
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
