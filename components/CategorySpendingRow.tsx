import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { ProgressBar, Text } from 'react-native-paper';
import { formatCurrency } from '@/lib/format';
import type { BudgetVsActualItem, CategorySpending } from '@/lib/db/queries';
import {
  CARD_INNER_GAP,
  layoutStyles,
  PROGRESS_BAR_HEIGHT,
  ROW_PADDING_H,
  ROW_PADDING_V,
} from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

const DONUT_TOP_N = 6;
const OTHER_COLOR = '#CBD5E1';

type Props = {
  item: CategorySpending;
  total: number;
  budget?: BudgetVsActualItem;
  grouped?: boolean;
  onPress?: () => void;
  onBudgetPress?: () => void;
};

export function CategorySpendingRow({
  item,
  total,
  budget,
  grouped = false,
  onPress,
  onBudgetPress,
}: Props) {
  const theme = useAppTheme();
  const percent = total > 0 ? Math.round((item.total / total) * 100) : 0;
  const progress = total > 0 ? item.total / total : 0;
  const remaining = budget ? budget.planned - budget.spent : null;
  const overBudget = budget != null && budget.planned > 0 && budget.spent > budget.planned;

  const content = (
    <>
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <Text variant="bodyLarge" style={styles.name} numberOfLines={1}>
            {item.categoryName}
          </Text>
        </View>
        <Text variant="titleMedium" style={{ fontWeight: '700', fontVariant: ['tabular-nums'] }}>
          {formatCurrency(item.total)}
        </Text>
      </View>
      <ProgressBar progress={Math.min(1, progress)} color={item.color} style={styles.bar} />
      <View style={styles.footer}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {percent}% of total
        </Text>
        {budget && budget.planned > 0 ? (
          <Pressable onPress={onBudgetPress}>
            <Text
              variant="labelMedium"
              style={{
                color: overBudget ? theme.colors.expense : theme.colors.onSurfaceVariant,
                fontWeight: '600',
              }}
            >
              {overBudget
                ? `${formatCurrency(Math.abs(remaining ?? 0))} over budget`
                : `${formatCurrency(remaining ?? 0)} left`}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </>
  );

  const rowStyle = grouped
    ? [styles.groupedRow, { backgroundColor: theme.colors.surface }]
    : [
        styles.standaloneRow,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
      ];

  if (!onPress) {
    return <View style={rowStyle}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        ...rowStyle,
        grouped && pressed ? { backgroundColor: theme.colors.surfaceElevated } : null,
        !grouped && {
          backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.surface,
        },
      ]}
    >
      {content}
    </Pressable>
  );
}

type DonutProps = {
  data: CategorySpending[];
  totalLabel: string;
  onSlicePress?: (item: CategorySpending) => void;
};

export function SpendingDonut({ data, totalLabel, onSlicePress }: DonutProps) {
  const theme = useAppTheme();
  const total = data.reduce((sum, item) => sum + item.total, 0);

  const pieData = useMemo(() => {
    if (data.length === 0 || total <= 0) return [];
    const sorted = [...data].sort((a, b) => b.total - a.total);
    const top = sorted.slice(0, DONUT_TOP_N);
    const rest = sorted.slice(DONUT_TOP_N);
    const otherTotal = rest.reduce((sum, item) => sum + item.total, 0);
    const slices = top.map((item) => ({
      value: item.total,
      color: item.color,
      categoryId: item.categoryId,
      onPress: () => onSlicePress?.(item),
    }));
    if (otherTotal > 0) {
      slices.push({
        value: otherTotal,
        color: OTHER_COLOR,
        categoryId: '__other__',
        onPress: () => {},
      });
    }
    return slices;
  }, [data, onSlicePress, total]);

  if (pieData.length === 0) {
    return (
      <View style={styles.donutEmpty}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          No data for this period.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.donutWrap}>
      <PieChart
        data={pieData}
        donut
        radius={92}
        innerRadius={58}
        innerCircleColor={theme.colors.surface}
        centerLabelComponent={() => (
          <View style={styles.centerLabel}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {totalLabel}
            </Text>
            <Text variant="titleLarge" style={{ fontWeight: '700', fontVariant: ['tabular-nums'] }}>
              {formatCurrency(total)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  standaloneRow: {
    borderRadius: layoutStyles.card.borderRadius,
    borderWidth: 1,
    paddingHorizontal: ROW_PADDING_H,
    paddingVertical: ROW_PADDING_V,
    gap: CARD_INNER_GAP,
  },
  groupedRow: {
    paddingHorizontal: ROW_PADDING_H,
    paddingVertical: ROW_PADDING_V,
    gap: CARD_INNER_GAP,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  nameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { flex: 1, fontWeight: '600' },
  bar: layoutStyles.progressBar,
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  donutWrap: { alignItems: 'center', paddingVertical: 8 },
  donutEmpty: { paddingVertical: 24, alignItems: 'center' },
  centerLabel: { alignItems: 'center', gap: 2, maxWidth: 100 },
});
