import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { formatCurrency } from '@/lib/format';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  label: string;
  amount: number;
  variant?: 'default' | 'income' | 'expense' | 'net';
  compact?: boolean;
  fullWidth?: boolean;
};

export function BalanceCard({
  label,
  amount,
  variant = 'default',
  compact = false,
  fullWidth = false,
}: Props) {
  const theme = useAppTheme();

  let accent = theme.colors.primary;
  let container = theme.colors.surface;
  let labelColor = theme.colors.onSurfaceVariant;

  if (variant === 'income') {
    accent = theme.colors.income;
    container = theme.colors.incomeContainer;
    labelColor = theme.colors.onIncomeContainer;
  } else if (variant === 'expense') {
    accent = theme.colors.expense;
    container = theme.colors.expenseContainer;
    labelColor = theme.colors.onExpenseContainer;
  } else if (variant === 'net') {
    const positive = amount >= 0;
    accent = positive ? theme.colors.income : theme.colors.expense;
    container = positive ? theme.colors.incomeContainer : theme.colors.expenseContainer;
    labelColor = positive ? theme.colors.onIncomeContainer : theme.colors.onExpenseContainer;
  }

  if (compact) {
    return (
      <View
        style={[
          styles.compactPill,
          fullWidth && styles.fullWidth,
          {
            borderColor: accent,
            backgroundColor: 'transparent',
          },
        ]}
      >
        <Text variant="labelMedium" style={{ color: labelColor }}>
          {label}
        </Text>
        <Text variant="titleMedium" style={[styles.compactAmount, { color: accent }]}>
          {formatCurrency(amount)}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        fullWidth && styles.fullWidth,
        { backgroundColor: container, borderLeftColor: accent },
      ]}
    >
      <Text variant="labelMedium" style={{ color: labelColor }}>
        {label}
      </Text>
      <Text variant="headlineSmall" style={[styles.amount, { color: accent }]}>
        {formatCurrency(amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 100,
    borderLeftWidth: 4,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  compactPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 0,
  },
  fullWidth: {
    flex: undefined,
    width: '100%',
    alignSelf: 'stretch',
  },
  amount: { fontWeight: '700', letterSpacing: -0.5 },
  compactAmount: { fontWeight: '700', fontVariant: ['tabular-nums'] },
});
