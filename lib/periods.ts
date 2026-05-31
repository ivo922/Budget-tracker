import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';

export type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

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
