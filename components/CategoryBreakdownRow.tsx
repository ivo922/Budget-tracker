import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { formatCurrency } from '@/lib/format';
import type { CategorySpending } from '@/lib/db/queries';
import { BORDER_RADIUS } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  data: CategorySpending[];
};

export function CategoryBreakdownRow({ data }: Props) {
  const theme = useAppTheme();

  if (data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {data.map((item) => {
        const percent = total > 0 ? Math.round((item.total / total) * 100) : 0;
        return (
          <View
            key={item.categoryId}
            style={[styles.chip, { backgroundColor: theme.colors.surface, borderColor: item.color }]}
          >
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <View style={styles.chipText}>
              <Text variant="labelMedium" numberOfLines={1}>
                {item.categoryName}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {formatCurrency(item.total)} · {percent}%
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS,
    borderWidth: 2,
    maxWidth: 160,
  },
  dot: { width: 10, height: 10, borderRadius: BORDER_RADIUS },
  chipText: { flexShrink: 1 },
});
