import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, ProgressBar, Text } from 'react-native-paper';
import { formatCurrency } from '@/lib/format';
import type { BudgetVsActual } from '@/lib/db/queries';
import { BORDER_RADIUS } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';
import { BudgetCategoryRow } from '@/components/BudgetCategoryRow';

type Props = {
  summary: BudgetVsActual;
  monthLabel: string;
  onPress?: () => void;
  onEdit?: () => void;
  onSetup?: () => void;
};

export function BudgetSummary({ summary, monthLabel, onPress, onEdit, onSetup }: Props) {
  const theme = useAppTheme();
  const { totalPlanned, totalSpent, overBudgetCount, items } = summary;

  const topItems = useMemo(
    () =>
      [...items]
        .filter((item) => item.planned > 0)
        .sort((a, b) => b.spent / b.planned - a.spent / a.planned)
        .slice(0, 3),
    [items],
  );

  const remaining = totalPlanned - totalSpent;
  const progress = totalPlanned > 0 ? Math.min(1, totalSpent / totalPlanned) : 0;
  const overBudget = totalSpent > totalPlanned && totalPlanned > 0;

  if (items.length === 0) {
    return (
      <Pressable
        onPress={onSetup ?? onPress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.surface,
            borderColor: theme.colors.outline,
          },
        ]}
      >
        <Text variant="titleMedium" style={styles.title}>
          {monthLabel} budget
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          No category budgets set yet.
        </Text>
        <Button mode="contained-tonal" compact onPress={onSetup ?? onPress}>
          Set up budgets
        </Button>
      </Pressable>
    );
  }

  const card = (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text variant="titleMedium" style={styles.title}>
          {monthLabel} budget
        </Text>
        {onEdit ? (
          <Button compact mode="text" onPress={onEdit}>
            Edit
          </Button>
        ) : null}
      </View>

      <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
        {formatCurrency(totalSpent)}
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {' '}
          / {formatCurrency(totalPlanned)} planned
        </Text>
      </Text>

      <Text
        variant="bodyMedium"
        style={{
          color: overBudget ? theme.colors.expense : theme.colors.income,
          fontWeight: '600',
        }}
      >
        {overBudget
          ? `${formatCurrency(Math.abs(remaining))} over budget`
          : `${formatCurrency(remaining)} remaining`}
      </Text>

      <ProgressBar
        progress={progress}
        color={overBudget ? theme.colors.expense : theme.colors.income}
        style={styles.bar}
      />

      {overBudgetCount > 0 ? (
        <Text variant="bodySmall" style={{ color: theme.colors.expense }}>
          {overBudgetCount} {overBudgetCount === 1 ? 'category' : 'categories'} over budget
        </Text>
      ) : null}

      <View style={styles.rows}>
        {topItems.map((item) => (
          <BudgetCategoryRow key={item.categoryId} item={item} />
        ))}
      </View>
    </View>
  );

  if (!onPress) return card;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
    >
      {card}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontWeight: '600' },
  bar: { height: 8, borderRadius: BORDER_RADIUS },
  rows: { gap: 8, marginTop: 4 },
});
