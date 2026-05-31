import { format, startOfMonth, subMonths } from 'date-fns';

export type MonthSection<T> = {
  title: string;
  key: string;
  data: T[];
};

export function groupByMonth<T extends { date: number }>(items: T[]): MonthSection<T>[] {
  const map = new Map<string, MonthSection<T>>();

  for (const item of items) {
    const d = new Date(item.date);
    const key = format(d, 'yyyy-MM');
    const title = format(d, 'MMMM yyyy');
    const existing = map.get(key);
    if (existing) {
      existing.data.push(item);
    } else {
      map.set(key, { key, title, data: [item] });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
}

export function monthSectionLabel(key: string, reference = new Date()): string {
  const thisMonth = format(startOfMonth(reference), 'yyyy-MM');
  const lastMonth = format(startOfMonth(subMonths(reference, 1)), 'yyyy-MM');
  if (key === thisMonth) return 'This month';
  if (key === lastMonth) return 'Last month';
  const [y, m] = key.split('-').map(Number);
  return format(new Date(y, m - 1, 1), 'MMMM yyyy');
}
