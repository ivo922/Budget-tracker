import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';
import { formatCurrency } from '@/lib/format';
import type { BudgetVsActualItem } from '@/lib/db/queries';
import {
  BORDER_RADIUS,
  CARD_INNER_GAP,
  layoutStyles,
  ROW_PADDING_H,
  ROW_PADDING_V,
} from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  item: BudgetVsActualItem;
  onPress?: () => void;
  highlighted?: boolean;
};

export function BudgetCategoryRow({ item, onPress, highlighted }: Props) {
  const theme = useAppTheme();
  const { planned, spent } = item;
  const remaining = planned - spent;
  const overBudget = planned > 0 && spent > planned;
  const progress = planned > 0 ? Math.min(1, spent / planned) : 0;
  const percent = planned > 0 ? Math.round((spent / planned) * 100) : 0;

  const content = (
    <>
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <Text variant="bodyLarge" style={styles.name} numberOfLines={1}>
            {item.categoryName}
          </Text>
        </View>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {formatCurrency(spent)} / {formatCurrency(planned)}
        </Text>
      </View>
      <ProgressBar
        progress={progress}
        color={overBudget ? theme.colors.expense : theme.colors.income}
        style={styles.bar}
      />
      <Text
        variant="bodySmall"
        style={{
          color: overBudget ? theme.colors.expense : theme.colors.onSurfaceVariant,
        }}
      >
        {overBudget
          ? `${formatCurrency(Math.abs(remaining))} over · ${percent}%`
          : `${formatCurrency(remaining)} left · ${percent}%`}
      </Text>
    </>
  );

  if (!onPress) {
    return (
      <View
        style={[
          styles.row,
          {
            backgroundColor: highlighted
              ? theme.colors.surfaceElevated
              : overBudget
                ? `${theme.colors.expense}12`
                : theme.colors.surface,
            borderColor: theme.colors.outline,
          },
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed || highlighted
            ? theme.colors.surfaceElevated
            : overBudget
              ? `${theme.colors.expense}12`
              : theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
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
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    flex: 1,
    fontWeight: '600',
  },
  bar: layoutStyles.progressBar,
});
