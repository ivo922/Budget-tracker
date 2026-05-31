import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Text, useTheme } from 'react-native-paper';
import { formatCurrency } from '@/lib/format';
import type { CategorySpending } from '@/lib/db/queries';
import { BORDER_RADIUS } from '@/lib/layout';

type Props = {
  data: CategorySpending[];
  onBarPress?: (item: CategorySpending) => void;
};

export function SpendingChart({ data, onBarPress }: Props) {
  const theme = useTheme();

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8, overflow: 'hidden' },
  empty: { padding: 24, alignItems: 'center' },
  tooltip: { padding: 8, borderRadius: BORDER_RADIUS, elevation: 2 },
});
