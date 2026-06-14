import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Text } from 'react-native-paper';
import { format, parseISO } from 'date-fns';
import type { GoalTimelinePoint } from '@/lib/db/queries';
import type { GoalType } from '@/lib/db/schema';
import { formatCurrency } from '@/lib/format';
import { BORDER_RADIUS } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  data: GoalTimelinePoint[];
  goalType: GoalType;
  targetAmount: number;
  title?: string;
};

export function GoalContributionChart({
  data,
  goalType,
  targetAmount,
  title = 'Progress over time',
}: Props) {
  const theme = useAppTheme();
  const color = goalType === 'loan' ? theme.colors.transfer : theme.colors.income;
  const hasContributions = data.some((d) => d.contribution !== 0);

  if (!hasContributions) {
    return (
      <View style={styles.empty}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          No contributions yet. Transactions linked to this goal will appear here.
        </Text>
      </View>
    );
  }

  const max = Math.max(...data.map((d) => d.cumulative), targetAmount, 1);
  const chartData = data.map((point, index) => ({
    value: point.cumulative,
    label:
      index % Math.max(1, Math.floor(data.length / 5)) === 0
        ? format(parseISO(point.date), 'MMM d')
        : '',
  }));

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      <LineChart
        data={chartData}
        height={140}
        spacing={Math.max(24, 280 / Math.max(data.length, 1))}
        initialSpacing={8}
        endSpacing={8}
        hideRules
        hideYAxisText
        xAxisThickness={0}
        yAxisThickness={0}
        color={color}
        thickness={2}
        curved
        areaChart
        startFillColor={`${color}40`}
        endFillColor={`${color}08`}
        startOpacity={0.4}
        endOpacity={0.05}
        maxValue={max * 1.1}
        showReferenceLine1
        referenceLine1Position={targetAmount}
        referenceLine1Config={{
          color: theme.colors.outline,
          thickness: 1,
          dashWidth: 4,
          dashGap: 4,
        }}
        xAxisLabelTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 10 }}
        pointerConfig={{
          pointerStripHeight: 120,
          pointerStripColor: theme.colors.outline,
          pointerColor: color,
          radius: 4,
          pointerLabelComponent: (items: { value: number }[]) => (
            <View style={[styles.tooltip, { backgroundColor: theme.colors.surface }]}>
              <Text variant="labelMedium">{formatCurrency(items[0]?.value ?? 0)}</Text>
            </View>
          ),
        }}
      />
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        Dashed line = target ({formatCurrency(targetAmount)})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, marginVertical: 8 },
  title: { fontWeight: '600' },
  empty: { paddingVertical: 16, alignItems: 'center' },
  tooltip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS,
    elevation: 2,
  },
});
