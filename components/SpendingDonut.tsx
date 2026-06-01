import React from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Text } from 'react-native-paper';
import { formatSignedCurrency } from '@/lib/format';
import type { CategorySpending } from '@/lib/db/queries';
import { SCREEN_PADDING } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

const RING_WIDTH = 14;

type Props = {
  data: CategorySpending[];
  netAmount: number;
  edgeToEdge?: boolean;
  onPress?: () => void;
};

export function SpendingDonut({ data, netAmount, edgeToEdge = false, onPress }: Props) {
  const theme = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = edgeToEdge ? windowWidth : windowWidth - SCREEN_PADDING * 2;
  const radius = chartWidth / 2;
  const innerRadius = radius - RING_WIDTH;

  const pieData =
    data.length > 0
      ? data.map((item) => ({
          value: item.total,
          color: item.color,
          strokeWidth: 1,
          strokeColor: theme.colors.background,
        }))
      : [{ value: 1, color: theme.colors.outlineVariant, strokeWidth: 0 }];

  const netColor = netAmount >= 0 ? theme.colors.income : theme.colors.expense;

  const chart = (
    <View style={[styles.container, edgeToEdge && styles.edgeToEdge, { width: chartWidth, height: chartWidth }]}>
      <PieChart
        data={pieData}
        donut
        radius={radius}
        innerRadius={innerRadius}
        innerCircleColor={theme.colors.background}
        centerLabelComponent={() => (
          <View style={styles.center}>
            <Text variant="headlineMedium" style={[styles.netAmount, { color: netColor }]}>
              {formatSignedCurrency(netAmount)}
            </Text>
          </View>
        )}
      />
    </View>
  );

  if (!onPress) return chart;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open analytics"
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {chart}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  edgeToEdge: {
    alignSelf: 'stretch',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '70%',
  },
  netAmount: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  pressed: { opacity: 0.85 },
});
