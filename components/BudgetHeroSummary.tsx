import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';
import { computeBudgetStatus, formatBudgetRemainingLabel } from '@/lib/budget';
import { formatCurrency } from '@/lib/format';
import { BORDER_RADIUS, layoutStyles } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  spent: number;
  planned: number;
  style?: ViewStyle;
  amountVariant?: 'headlineSmall' | 'headlineMedium';
  plannedVariant?: 'bodyMedium' | 'bodyLarge';
  statusVariant?: 'bodyMedium' | 'titleMedium';
  barStyle?: ViewStyle;
};

export function BudgetHeroSummary({
  spent,
  planned,
  style,
  amountVariant = 'headlineSmall',
  plannedVariant = 'bodyMedium',
  statusVariant = 'bodyMedium',
  barStyle,
}: Props) {
  const theme = useAppTheme();
  const status = computeBudgetStatus(planned, spent);
  const { overBudget, progress } = status;

  return (
    <View style={style}>
      <Text variant={amountVariant} style={styles.amount}>
        {formatCurrency(spent)}
        <Text variant={plannedVariant} style={{ color: theme.colors.onSurfaceVariant }}>
          {' '}
          / {formatCurrency(planned)} planned
        </Text>
      </Text>
      <Text
        variant={statusVariant}
        style={{
          color: overBudget ? theme.colors.expense : theme.colors.income,
          fontWeight: '600',
        }}
      >
        {formatBudgetRemainingLabel(status, 'hero')}
      </Text>
      <ProgressBar
        progress={progress}
        color={overBudget ? theme.colors.expense : theme.colors.income}
        style={[styles.bar, barStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  amount: { fontWeight: '700' },
  bar: layoutStyles.progressBar,
});
