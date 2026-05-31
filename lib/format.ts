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

export { ACCOUNT_COLORS } from './colors';
