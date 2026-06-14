import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { BalanceCard } from '@/components/BalanceCard';
import { formatCurrency } from '@/lib/format';
import { BORDER_RADIUS } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  periodLabel: string;
  income: number;
  expense: number;
  net: number;
  expenseDelta?: number | null;
  expenseDeltaPercent?: number | null;
  previousPeriodLabel?: string | null;
};

export function AnalyticsHeroSummary({
  periodLabel,
  income,
  expense,
  net,
  expenseDelta,
  expenseDeltaPercent,
  previousPeriodLabel,
}: Props) {
  const theme = useAppTheme();
  const showDelta =
    expenseDelta != null &&
    previousPeriodLabel &&
    (expenseDelta !== 0 || (expenseDeltaPercent != null && expenseDeltaPercent !== 0));

  return (
    <View style={styles.wrapper}>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {periodLabel}
      </Text>

      <BalanceCard label="Net" amount={net} variant="net" fullWidth />

      <View
        style={[
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
        <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
        <Text style={[styles.total, { color: theme.colors.expense }]}>
          -{formatCurrency(expense)}
        </Text>
      </View>

      {showDelta ? (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          vs {previousPeriodLabel}:{' '}
          <Text
            style={{
              color: (expenseDelta ?? 0) <= 0 ? theme.colors.income : theme.colors.expense,
              fontWeight: '600',
            }}
          >
            {(expenseDelta ?? 0) <= 0 ? '' : '+'}
            {formatCurrency(expenseDelta ?? 0)} expenses
            {expenseDeltaPercent != null ? ` (${expenseDeltaPercent > 0 ? '+' : ''}${expenseDeltaPercent}%)` : ''}
          </Text>
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8, marginBottom: 8 },
  totalsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  total: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
});
