import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';
import { formatCurrency } from '@/lib/format';
import type { GoalProgress } from '@/lib/db/queries';
import { BORDER_RADIUS } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  item: GoalProgress;
};

export function GoalCard({ item }: Props) {
  const theme = useAppTheme();
  const { goal, progress, remaining, percent } = item;
  const isLoan = goal.type === 'loan';
  const progressValue = percent / 100;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={{ fontWeight: '600', flex: 1 }} numberOfLines={1}>
          {goal.name}
        </Text>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {isLoan ? 'Loan' : 'Savings'}
        </Text>
      </View>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {formatCurrency(progress)} of {formatCurrency(goal.targetAmount)}
      </Text>
      <ProgressBar progress={progressValue} color={isLoan ? theme.colors.transfer : theme.colors.income} style={styles.bar} />
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {goal.status === 'completed'
          ? 'Completed'
          : `${Math.round(percent)}% · ${formatCurrency(remaining)} ${isLoan ? 'left to pay' : 'to go'}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bar: { height: 8, borderRadius: BORDER_RADIUS },
});
