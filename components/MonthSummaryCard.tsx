import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { ThemedMenu, ThemedMenuItem } from '@/components/ThemedMenu';
import { formatCurrency } from '@/lib/format';
import {
  BORDER_RADIUS,
  CARD_GAP,
  PILL_PADDING_H,
  PILL_PADDING_V,
} from '@/lib/layout';
import {
  DASHBOARD_PERIOD_OPTIONS,
  type DashboardPeriod,
} from '@/lib/periods';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
  income: number;
  expense: number;
};

export function MonthSummaryCard({ period, onPeriodChange, income, expense }: Props) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const selected = DASHBOARD_PERIOD_OPTIONS.find((o) => o.value === period);

  return (
    <View style={styles.wrapper}>
      <ThemedMenu
        visible={open}
        onDismiss={() => setOpen(false)}
        anchor={
          <Pressable
            onPress={() => setOpen(true)}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.surface,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            <Text variant="bodyLarge" style={styles.periodText}>
              {selected?.label ?? 'This month'}
            </Text>
            <MaterialCommunityIcons
              name={open ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </Pressable>
        }
      >
        {DASHBOARD_PERIOD_OPTIONS.map((opt) => (
          <ThemedMenuItem
            key={opt.value}
            title={opt.label}
            titleStyle={opt.value === period ? { color: theme.colors.primary, fontWeight: '600' } : undefined}
            onPress={() => {
              onPeriodChange(opt.value);
              setOpen(false);
            }}
          />
        ))}
      </ThemedMenu>

      <View
        style={[
          styles.pill,
          styles.totalsPill,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
          },
        ]}
      >
        <Text style={[styles.total, { color: theme.colors.income }]}>
          +{formatCurrency(income)}
        </Text>
        <View style={[styles.totalDivider, { backgroundColor: theme.colors.outline }]} />
        <Text style={[styles.total, { color: theme.colors.expense }]}>
          -{formatCurrency(expense)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS,
    paddingHorizontal: PILL_PADDING_H,
    paddingVertical: PILL_PADDING_V,
    overflow: 'hidden',
  },
  periodText: {
    fontWeight: '600',
  },
  totalsPill: {
    justifyContent: 'center',
    gap: 12,
  },
  total: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  totalDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
});
