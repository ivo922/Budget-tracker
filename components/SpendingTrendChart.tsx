import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Text } from 'react-native-paper';
import { formatCurrency } from '@/lib/format';
import { format, parseISO } from 'date-fns';
import { BORDER_RADIUS } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  data: { day: string; total: number }[];
  title?: string;
};

export function SpendingTrendChart({ data, title = 'Daily spending' }: Props) {
  const theme = useAppTheme();
  const max = Math.max(...data.map((d) => d.total), 1);
  const hasData = data.some((d) => d.total > 0);

  if (!hasData) {
    return (
      <View style={styles.empty}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          No spending trend for this period.
        </Text>
      </View>
    );
  }

  const chartData = data.map((point, index) => ({
    value: point.total,
    label: index % Math.max(1, Math.floor(data.length / 5)) === 0 ? format(parseISO(point.day), 'd') : '',
  }));

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      <LineChart
        data={chartData}
        height={120}
        spacing={Math.max(18, 280 / Math.max(data.length, 1))}
        initialSpacing={8}
        endSpacing={8}
        hideRules
        hideYAxisText
        xAxisThickness={0}
        yAxisThickness={0}
        color={theme.colors.expense}
        thickness={2}
        curved
        areaChart
        startFillColor={`${theme.colors.expense}40`}
        endFillColor={`${theme.colors.expense}08`}
        startOpacity={0.4}
        endOpacity={0.05}
        maxValue={max * 1.15}
        xAxisLabelTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 10 }}
        pointerConfig={{
          pointerStripHeight: 100,
          pointerStripColor: theme.colors.outline,
          pointerColor: theme.colors.expense,
          radius: 4,
          pointerLabelComponent: (items: { value: number }[]) => (
            <View style={[styles.tooltip, { backgroundColor: theme.colors.surface }]}>
              <Text variant="labelMedium">{formatCurrency(items[0]?.value ?? 0)}</Text>
            </View>
          ),
        }}
      />
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
