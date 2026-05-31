import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';
import { formatCurrency } from '@/lib/format';
import type { BudgetVsActual } from '@/lib/db/queries';
import { BORDER_RADIUS } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  summary: BudgetVsActual;
};

export function BudgetSummary({ summary }: Props) {
  const theme = useAppTheme();
  const { totalPlanned, totalSpent, items } = summary;

  if (items.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          No category budgets set. Tap Edit to add planned amounts.
        </Text>
      </View>
    );
  }

  const progress = totalPlanned > 0 ? Math.min(1, totalSpent / totalPlanned) : 0;
  const overBudget = totalSpent > totalPlanned && totalPlanned > 0;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
      <Text variant="titleMedium" style={styles.title}>
        Monthly budget
      </Text>
      <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
        {formatCurrency(totalSpent)}
        {totalPlanned > 0 ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {' '}
            / {formatCurrency(totalPlanned)} planned
          </Text>
        ) : null}
      </Text>
      {totalPlanned > 0 ? (
        <ProgressBar
          progress={progress}
          color={overBudget ? theme.colors.expense : theme.colors.income}
          style={styles.bar}
        />
      ) : null}
      {items.slice(0, 3).map((item) => (
        <View key={item.categoryId} style={styles.row}>
          <Text variant="bodySmall" style={{ flex: 1 }} numberOfLines={1}>
            {item.categoryName}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {formatCurrency(item.spent)} / {formatCurrency(item.planned)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  title: { fontWeight: '600' },
  bar: { height: 8, borderRadius: BORDER_RADIUS },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
