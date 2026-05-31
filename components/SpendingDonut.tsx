import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Text } from 'react-native-paper';
import { formatCurrency } from '@/lib/format';
import type { CategorySpending } from '@/lib/db/queries';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  data: CategorySpending[];
};

export function SpendingDonut({ data }: Props) {
  const theme = useAppTheme();

  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          No spending data for this period.
        </Text>
      </View>
    );
  }

  const total = data.reduce((sum, d) => sum + d.total, 0);
  const pieData = data.map((item) => ({
    value: item.total,
    color: item.color,
  }));

  return (
    <View style={styles.container}>
      <PieChart
        data={pieData}
        donut
        radius={72}
        innerRadius={48}
        innerCircleColor={theme.colors.surface}
        centerLabelComponent={() => (
          <View style={styles.center}>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Spent
            </Text>
            <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.onSurface }}>
              {formatCurrency(total)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 8 },
  center: { alignItems: 'center' },
  empty: { padding: 24, alignItems: 'center' },
});
