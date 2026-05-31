import {
  MD3DarkTheme,
  MD3LightTheme,
  configureFonts,
  type MD3Theme,
} from 'react-native-paper';
import { palette, type AppPalette } from './colors';

export type AppColors = MD3Theme['colors'] & AppPalette;

export type AppTheme = Omit<MD3Theme, 'colors'> & { colors: AppColors };

const fontConfig = { fontFamily: 'System' };

function buildTheme(base: MD3Theme, colors: AppPalette): AppTheme {
  return {
    ...base,
    roundness: 12,
    fonts: configureFonts({ config: fontConfig }),
    colors: {
      ...base.colors,
      primary: colors.primary,
      onPrimary: colors.onPrimary,
      background: colors.background,
      surface: colors.surface,
      onSurface: colors.onSurface,
      onSurfaceVariant: colors.onSurfaceMuted,
      outline: colors.outline,
      outlineVariant: colors.outlineVariant,
      error: colors.error,
      errorContainer: colors.errorContainer,
      surfaceElevated: colors.surfaceElevated,
      onSurfaceMuted: colors.onSurfaceMuted,
      income: colors.income,
      onIncome: colors.onIncome,
      incomeContainer: colors.incomeContainer,
      onIncomeContainer: colors.onIncomeContainer,
      expense: colors.expense,
      onExpense: colors.onExpense,
      expenseContainer: colors.expenseContainer,
      onExpenseContainer: colors.onExpenseContainer,
      transfer: colors.transfer,
      onTransfer: colors.onTransfer,
      transferContainer: colors.transferContainer,
      onTransferContainer: colors.onTransferContainer,
    },
  };
}

export const lightTheme = buildTheme(MD3LightTheme, palette.light);
export const darkTheme = buildTheme(MD3DarkTheme, palette.dark);
