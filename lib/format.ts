import { format } from 'date-fns';

export function formatCurrency(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
}

export function formatDate(timestamp: number): string {
  return format(new Date(timestamp), 'MMM d, yyyy');
}

export function formatDateShort(timestamp: number): string {
  return format(new Date(timestamp), 'MMM d');
}

export function formatTransactionType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export const ACCOUNT_COLORS = [
  '#6750A4',
  '#1565C0',
  '#2E7D32',
  '#C62828',
  '#E65100',
  '#00838F',
  '#6A1B9A',
  '#AD1457',
];
