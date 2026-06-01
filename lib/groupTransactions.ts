import { format, isToday, isYesterday, startOfDay, startOfMonth, subMonths } from 'date-fns';
import type { Transaction } from '@/lib/db/schema';

export type MonthSection<T> = {
  title: string;
  key: string;
  data: T[];
};

export type DaySection<T> = {
  dayKey: string;
  monthKey: string;
  title: string;
  total: number;
  data: T[];
};

export function transactionNetAmount(tx: Pick<Transaction, 'type' | 'amount'>): number {
  if (tx.type === 'income') return tx.amount;
  if (tx.type === 'expense') return -tx.amount;
  return 0;
}

export function dayNetTotal(txs: Pick<Transaction, 'type' | 'amount'>[]): number {
  return txs.reduce((sum, tx) => sum + transactionNetAmount(tx), 0);
}

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

export function groupByDay<T extends { date: number; tx: Transaction }>(items: T[]): DaySection<T>[] {
  const map = new Map<string, DaySection<T>>();

  for (const item of items) {
    const d = startOfDay(new Date(item.date));
    const dayKey = format(d, 'yyyy-MM-dd');
    const monthKey = format(d, 'yyyy-MM');
    const existing = map.get(dayKey);
    if (existing) {
      existing.data.push(item);
    } else {
      map.set(dayKey, {
        dayKey,
        monthKey,
        title: daySectionLabel(item.date),
        total: 0,
        data: [item],
      });
    }
  }

  const sections = Array.from(map.values()).sort((a, b) => b.dayKey.localeCompare(a.dayKey));
  for (const section of sections) {
    section.total = dayNetTotal(section.data.map((e) => e.tx));
  }
  return sections;
}

export function daySectionLabel(timestamp: number, reference = new Date()): string {
  const d = new Date(timestamp);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  if (d.getFullYear() === reference.getFullYear()) return format(d, 'MMM d');
  return format(d, 'MMM d, yyyy');
}

/** Index of the first day-section for a month (most recent day in that month). */
export function leadingSectionIndexForMonth<T extends { monthKey: string }>(
  sections: readonly T[],
  monthKey: string,
): number {
  return sections.findIndex((section) => section.monthKey === monthKey);
}

export function monthNavLabel(key: string, reference = new Date()): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  if (y === reference.getFullYear()) return format(d, 'MMMM');
  return format(d, 'MMM yyyy');
}

export function monthSectionLabel(key: string, reference = new Date()): string {
  const thisMonth = format(startOfMonth(reference), 'yyyy-MM');
  const lastMonth = format(startOfMonth(subMonths(reference, 1)), 'yyyy-MM');
  if (key === thisMonth) return 'This month';
  if (key === lastMonth) return 'Last month';
  const [y, m] = key.split('-').map(Number);
  return format(new Date(y, m - 1, 1), 'MMMM yyyy');
}
