import type { GoalType, TransactionType } from '@/lib/db/schema';

export interface AppPalette {
  background: string;
  surface: string;
  surfaceElevated: string;
  onSurface: string;
  onSurfaceMuted: string;
  outline: string;
  outlineVariant: string;
  primary: string;
  onPrimary: string;
  income: string;
  onIncome: string;
  incomeContainer: string;
  onIncomeContainer: string;
  expense: string;
  onExpense: string;
  expenseContainer: string;
  onExpenseContainer: string;
  transfer: string;
  onTransfer: string;
  transferContainer: string;
  onTransferContainer: string;
  error: string;
  errorContainer: string;
}

/** Semantic palette — income (green), expense (red), transfer (light blue). */
export const palette: { light: AppPalette; dark: AppPalette } = {
  light: {
    background: '#F4F6F8',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    onSurface: '#1A1D21',
    onSurfaceMuted: '#5C6570',
    outline: '#E2E6EA',
    outlineVariant: '#EEF0F2',
    primary: '#2D3748',
    onPrimary: '#FFFFFF',
    income: '#22A55B',
    onIncome: '#FFFFFF',
    incomeContainer: '#E8F7EE',
    onIncomeContainer: '#166534',
    expense: '#DC3545',
    onExpense: '#FFFFFF',
    expenseContainer: '#FDECEE',
    onExpenseContainer: '#991B1B',
    transfer: '#3B9FD9',
    onTransfer: '#FFFFFF',
    transferContainer: '#E6F4FC',
    onTransferContainer: '#075985',
    error: '#DC3545',
    errorContainer: '#FDECEE',
  },
  dark: {
    background: '#121418',
    surface: '#1C1F24',
    surfaceElevated: '#252930',
    onSurface: '#F0F2F5',
    onSurfaceMuted: '#9AA3AD',
    outline: '#2E3339',
    outlineVariant: '#252930',
    primary: '#E2E8F0',
    onPrimary: '#121418',
    income: '#4ADE80',
    onIncome: '#052E16',
    incomeContainer: '#14532D',
    onIncomeContainer: '#BBF7D0',
    expense: '#F87171',
    onExpense: '#450A0A',
    expenseContainer: '#7F1D1D',
    onExpenseContainer: '#FECACA',
    transfer: '#7DD3FC',
    onTransfer: '#0C4A6E',
    transferContainer: '#0C4A6E',
    onTransferContainer: '#E0F2FE',
    error: '#F87171',
    errorContainer: '#7F1D1D',
  },
};

type TransactionColorSource = Pick<
  AppPalette,
  | 'income'
  | 'incomeContainer'
  | 'onIncomeContainer'
  | 'expense'
  | 'expenseContainer'
  | 'onExpenseContainer'
  | 'transfer'
  | 'transferContainer'
  | 'onTransferContainer'
>;

export function getTransactionColors(type: TransactionType, colors: TransactionColorSource) {
  switch (type) {
    case 'income':
      return {
        main: colors.income,
        container: colors.incomeContainer,
        onContainer: colors.onIncomeContainer,
      };
    case 'expense':
      return {
        main: colors.expense,
        container: colors.expenseContainer,
        onContainer: colors.onExpenseContainer,
      };
    case 'transfer':
      return {
        main: colors.transfer,
        container: colors.transferContainer,
        onContainer: colors.onTransferContainer,
      };
  }
}

export function getGoalColors(type: GoalType, colors: TransactionColorSource) {
  return getTransactionColors(type === 'savings' ? 'income' : 'transfer', colors);
}

/** Muted text / uncategorized category dot */
export const MUTED_GRAY = '#9AA3AD';

/** Account picker swatches — distinct from transaction semantic colors. */
export const ACCOUNT_COLORS = [
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#14B8A6',
  '#64748B',
  '#A855F7',
  '#0EA5E9',
];
