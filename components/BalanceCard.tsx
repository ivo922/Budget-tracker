import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { formatCurrency } from '@/lib/format';
import {
  BORDER_RADIUS,
  CARD_GAP,
  CARD_INNER_GAP,
  PILL_PADDING_H,
  PILL_PADDING_V,
} from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  label: string;
  amount: number;
  variant?: 'default' | 'income' | 'expense' | 'net';
  compact?: boolean;
  fullWidth?: boolean;
};

export function BalanceCard({
  label,
  amount,
  variant = 'default',
  compact = false,
  fullWidth = false,
}: Props) {
  const theme = useAppTheme();

  let accent = theme.colors.primary;

  if (variant === 'income') {
    accent = theme.colors.income;
  } else if (variant === 'expense') {
    accent = theme.colors.expense;
  } else if (variant === 'net') {
    accent = amount >= 0 ? theme.colors.income : theme.colors.expense;
  }

  const cardStyle = compact ? styles.compactPill : styles.card;

  return (
    <View
      style={[
        cardStyle,
        fullWidth && styles.fullWidth,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
    >
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      <Text
        variant={compact ? 'titleMedium' : 'headlineSmall'}
        style={[compact ? styles.compactAmount : styles.amount, { color: accent }]}
      >
        {formatCurrency(amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 100,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS,
    paddingHorizontal: PILL_PADDING_H,
    paddingVertical: PILL_PADDING_V,
    gap: CARD_INNER_GAP / 2,
  },
  compactPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS,
    paddingHorizontal: CARD_INNER_GAP + 8,
    paddingVertical: PILL_PADDING_V,
    minWidth: 0,
  },
  fullWidth: {
    flex: undefined,
    width: '100%',
    alignSelf: 'stretch',
  },
  amount: { fontWeight: '700', letterSpacing: -0.5 },
  compactAmount: { fontWeight: '700', fontVariant: ['tabular-nums'] },
});
