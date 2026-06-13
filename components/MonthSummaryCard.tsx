import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { formatCurrency } from '@/lib/format';
import { BORDER_RADIUS } from '@/lib/layout';
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
      <View style={[styles.wrap, open && styles.wrapOpen]}>
        <Pressable
          onPress={() => setOpen((o) => !o)}
          style={({ pressed }) => [
            styles.pill,
            {
              backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.outlineVariant,
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

        {open ? (
          <View
            style={[
              styles.menu,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
              },
            ]}
          >
            {DASHBOARD_PERIOD_OPTIONS.map((opt, index) => (
              <View key={opt.value}>
                {index > 0 ? (
                  <View style={[styles.menuDivider, { backgroundColor: theme.colors.outlineVariant }]} />
                ) : null}
                <Pressable
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor:
                        pressed || opt.value === period
                          ? theme.colors.surfaceElevated
                          : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    onPeriodChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <Text
                    variant="bodyLarge"
                    style={[
                      styles.optionText,
                      opt.value === period && { color: theme.colors.primary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={[styles.pill, styles.totalsPill, { backgroundColor: theme.colors.outlineVariant }]}>
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
    gap: 8,
    marginBottom: 12,
  },
  wrap: { zIndex: 1 },
  wrapOpen: { zIndex: 20 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BORDER_RADIUS,
    paddingHorizontal: 14,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  periodText: {
    fontWeight: '600',
  },
  menu: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionText: {
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
