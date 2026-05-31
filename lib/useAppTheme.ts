import { useTheme } from 'react-native-paper';
import { getTransactionColors } from './colors';
import type { TransactionType } from './db/schema';
import type { AppTheme } from './theme';

export function useAppTheme(): AppTheme {
  return useTheme() as AppTheme;
}

export function useTransactionTheme(type: TransactionType) {
  const theme = useAppTheme();
  return getTransactionColors(type, theme.colors);
}

/** Shared destructive / validation error text style. */
export function useErrorStyle() {
  const theme = useAppTheme();
  return { color: theme.colors.error } as const;
}
