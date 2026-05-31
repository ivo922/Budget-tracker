import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { formatCurrency } from '@/lib/format';

type Props = {
  label: string;
  amount: number;
  variant?: 'default' | 'income' | 'expense' | 'net';
};

export function BalanceCard({ label, amount, variant = 'default' }: Props) {
  const theme = useTheme();
  const color =
    variant === 'income'
      ? '#2E7D32'
      : variant === 'expense'
        ? '#C62828'
        : variant === 'net'
          ? amount >= 0
            ? '#2E7D32'
            : '#C62828'
          : theme.colors.primary;

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="labelMedium">{label}</Text>
        <Text variant="headlineSmall" style={{ color, fontWeight: '700' }}>
          {formatCurrency(amount)}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 100 },
});
