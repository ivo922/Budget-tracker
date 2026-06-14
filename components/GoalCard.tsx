import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Chip, ProgressBar, Text } from 'react-native-paper';
import { formatCurrency } from '@/lib/format';
import type { GoalProgress } from '@/lib/db/queries';
import { BORDER_RADIUS, CARD_INNER_GAP, CARD_PADDING, layoutStyles } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  item: GoalProgress;
  linkedAccountName?: string;
  linkedAccountBalance?: number;
  paceLabel?: string;
  dueLabel?: string;
  compact?: boolean;
  onPress?: () => void;
  onLinkPress?: () => void;
};

export function GoalCard({
  item,
  linkedAccountName,
  linkedAccountBalance,
  paceLabel,
  dueLabel,
  compact = false,
  onPress,
  onLinkPress,
}: Props) {
  const theme = useAppTheme();
  const router = useRouter();
  const { goal, progress, remaining, percent } = item;
  const isLoan = goal.type === 'loan';
  const progressValue = percent / 100;
  const accentColor = isLoan ? theme.colors.transfer : theme.colors.income;
  const iconName = isLoan ? 'cash-minus' : 'piggy-bank-outline';

  const content = (
    <>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: `${accentColor}22` }]}>
          <MaterialCommunityIcons name={iconName} size={compact ? 18 : 20} color={accentColor} />
        </View>
        <Text
          variant={compact ? 'titleSmall' : 'titleMedium'}
          style={{ fontWeight: '600', flex: 1 }}
          numberOfLines={1}
        >
          {goal.name}
        </Text>
        {goal.status === 'completed' ? (
          <Chip compact style={{ backgroundColor: theme.colors.primaryContainer }}>
            Done
          </Chip>
        ) : (
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {isLoan ? 'Loan' : 'Savings'}
          </Text>
        )}
      </View>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {formatCurrency(progress)} of {formatCurrency(goal.targetAmount)}
      </Text>
      {dueLabel ? (
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {dueLabel}
        </Text>
      ) : null}
      {linkedAccountName ? (
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {linkedAccountName}
          {linkedAccountBalance !== undefined ? ` · ${formatCurrency(linkedAccountBalance)}` : ''}
        </Text>
      ) : !isLoan && goal.status === 'active' ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            if (onLinkPress) {
              onLinkPress();
            } else {
              router.push(`/goal/link/${goal.id}`);
            }
          }}
        >
          <Chip compact icon="link-variant-off" style={styles.linkChip}>
            Not linked
          </Chip>
        </Pressable>
      ) : isLoan && goal.status === 'active' ? (
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Link expenses when adding transactions
        </Text>
      ) : null}
      <ProgressBar progress={progressValue} color={accentColor} style={styles.bar} />
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {goal.status === 'completed'
          ? 'Completed'
          : `${Math.round(percent)}% · ${formatCurrency(remaining)} ${isLoan ? 'left to pay' : 'to go'}`}
      </Text>
      {paceLabel ? (
        <Text
          variant="labelSmall"
          style={{
            color:
              paceLabel.includes('Behind')
                ? theme.colors.error
                : paceLabel.includes('Ahead')
                  ? theme.colors.income
                  : theme.colors.onSurfaceVariant,
          }}
        >
          {paceLabel}
        </Text>
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View
        style={[
          styles.card,
          compact && styles.cardCompact,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
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
        styles.card,
        compact && styles.cardCompact,
        {
          backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    padding: CARD_PADDING,
    gap: CARD_INNER_GAP,
  },
  cardCompact: {
    padding: CARD_PADDING - 4,
    gap: CARD_INNER_GAP - 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: layoutStyles.progressBar,
  linkChip: { alignSelf: 'flex-start' },
});
