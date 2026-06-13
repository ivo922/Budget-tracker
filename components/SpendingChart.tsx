import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Text, useTheme } from 'react-native-paper';
import { formatCurrency } from '@/lib/format';
import type { BudgetVsActualItem, CategorySpending } from '@/lib/db/queries';
import { BORDER_RADIUS } from '@/lib/layout';

type Props = {
  data: CategorySpending[];
  onBarPress?: (item: CategorySpending) => void;
  budgetItems?: BudgetVsActualItem[];
  onBudgetPress?: (categoryId: string) => void;
};

export function SpendingChart({ data, onBarPress, budgetItems, onBudgetPress }: Props) {
  const theme = useTheme();
  const budgetMap = new Map((budgetItems ?? []).map((item) => [item.categoryId, item]));

  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="bodyMedium">No spending data for this period.</Text>
      </View>
    );
  }

  const max = Math.max(...data.map((d) => d.total), 1);
  const chartData = data.map((item) => ({
    value: item.total,
    label: item.categoryName.slice(0, 8),
    frontColor: item.color,
    onPress: () => onBarPress?.(item),
  }));

  const chips = data
    .map((item) => {
      const budget = budgetMap.get(item.categoryId);
      if (!budget || budget.planned <= 0) return null;
      const remaining = budget.planned - budget.spent;
      const overBudget = budget.spent > budget.planned;
      return {
        categoryId: item.categoryId,
        label: overBudget
          ? `${item.categoryName}: ${formatCurrency(Math.abs(remaining))} over`
          : `${item.categoryName}: ${formatCurrency(remaining)} left`,
        overBudget,
      };
    })
    .filter((chip): chip is NonNullable<typeof chip> => chip !== null);

  return (
    <View style={styles.container}>
      <BarChart
        data={chartData}
        barWidth={28}
        spacing={16}
        roundedTop
        hideRules
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisTextStyle={{ color: theme.colors.onSurfaceVariant }}
        xAxisLabelTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 10 }}
        noOfSections={4}
        maxValue={max * 1.1}
        renderTooltip={(item: { value: number }) => (
          <View style={[styles.tooltip, { backgroundColor: theme.colors.surface }]}>
            <Text>{formatCurrency(item.value)}</Text>
          </View>
        )}
      />

      {chips.length > 0 ? (
        <View style={styles.chips}>
          {chips.map((chip) => (
            <Pressable
              key={chip.categoryId}
              onPress={() => onBudgetPress?.(chip.categoryId)}
              style={[
                styles.chip,
                {
                  backgroundColor: chip.overBudget
                    ? `${theme.colors.error}18`
                    : theme.colors.surface,
                  borderColor: chip.overBudget ? theme.colors.error : theme.colors.outline,
                },
              ]}
            >
              <Text
                variant="labelMedium"
                style={{ color: chip.overBudget ? theme.colors.error : theme.colors.onSurface }}
              >
                {chip.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8, overflow: 'hidden', gap: 12 },
  empty: { padding: 24, alignItems: 'center' },
  tooltip: { padding: 8, borderRadius: BORDER_RADIUS, elevation: 2 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});
