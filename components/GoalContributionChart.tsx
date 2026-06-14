import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';
import { LineChart } from 'react-native-gifted-charts';
import { Text } from 'react-native-paper';
import { differenceInDays, format, parseISO, subMonths } from 'date-fns';
import type { GoalTimelinePoint } from '@/lib/db/queries';
import type { GoalType } from '@/lib/db/schema';
import { formatCurrency } from '@/lib/format';
import { BORDER_RADIUS } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type ChartPeriod = '3m' | '6m' | 'all';

type Props = {
  data: GoalTimelinePoint[];
  goalType: GoalType;
  targetAmount: number;
  targetDate?: number | null;
  createdAt?: number;
  startingBalance?: number;
  title?: string;
};

export function GoalContributionChart({
  data,
  goalType,
  targetAmount,
  targetDate,
  createdAt,
  startingBalance = 0,
  title = 'Progress over time',
}: Props) {
  const theme = useAppTheme();
  const color = goalType === 'loan' ? theme.colors.transfer : theme.colors.income;
  const [period, setPeriod] = useState<ChartPeriod>('all');
  const hasContributions = data.some((d) => d.contribution !== 0);

  const filteredData = useMemo(() => {
    if (period === 'all') return data;
    const cutoff = subMonths(new Date(), period === '3m' ? 3 : 6);
    const cutoffKey = format(cutoff, 'yyyy-MM-dd');
    const slice = data.filter((point) => point.date >= cutoffKey);
    if (slice.length === 0) return data.slice(-1);
    if (slice[0].contribution !== 0 || slice[0].cumulative !== startingBalance) {
      const prior = data.filter((p) => p.date < cutoffKey).at(-1);
      return [{ date: slice[0].date, cumulative: prior?.cumulative ?? startingBalance, contribution: 0 }, ...slice];
    }
    return slice;
  }, [data, period, startingBalance]);

  const pacePosition = useMemo(() => {
    if (!targetDate || !createdAt || targetAmount <= startingBalance) return undefined;
    const totalDays = Math.max(1, differenceInDays(new Date(targetDate), new Date(createdAt)));
    const elapsedDays = Math.max(0, differenceInDays(new Date(), new Date(createdAt)));
    const ratio = Math.min(1, elapsedDays / totalDays);
    return startingBalance + (targetAmount - startingBalance) * ratio;
  }, [createdAt, startingBalance, targetAmount, targetDate]);

  if (!hasContributions) {
    return (
      <View style={styles.empty}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          No contributions yet. Transactions linked to this goal will appear here.
        </Text>
      </View>
    );
  }

  const max = Math.max(...filteredData.map((d) => d.cumulative), targetAmount, pacePosition ?? 0, 1);
  const chartData = filteredData.map((point, index) => ({
    value: point.cumulative,
    label:
      index % Math.max(1, Math.floor(filteredData.length / 5)) === 0
        ? format(parseISO(point.date), 'MMM d')
        : '',
  }));

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text variant="titleMedium" style={styles.title}>
          {title}
        </Text>
        <View style={styles.periodChips}>
          {(['3m', '6m', 'all'] as ChartPeriod[]).map((key) => (
            <Chip
              key={key}
              compact
              selected={period === key}
              onPress={() => setPeriod(key)}
              showSelectedCheck={false}
            >
              {key === 'all' ? 'All' : key.toUpperCase()}
            </Chip>
          ))}
        </View>
      </View>
      <LineChart
        data={chartData}
        height={140}
        spacing={Math.max(24, 280 / Math.max(filteredData.length, 1))}
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
        showReferenceLine2={pacePosition !== undefined}
        referenceLine2Position={pacePosition}
        referenceLine2Config={{
          color: theme.colors.primary,
          thickness: 1,
          dashWidth: 2,
          dashGap: 6,
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
        {pacePosition !== undefined ? ' · Solid line = expected pace' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, marginVertical: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontWeight: '600', flex: 1 },
  periodChips: { flexDirection: 'row', gap: 4 },
  empty: { paddingVertical: 16, alignItems: 'center' },
  tooltip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS,
    elevation: 2,
  },
});
