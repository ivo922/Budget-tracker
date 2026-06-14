import React, { useCallback, useRef } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import ReanimatedSwipeable, {
  SwipeDirection,
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Chip, Text } from 'react-native-paper';
import { useApp } from '@/lib/context/AppContext';
import { deleteTransaction, updateTransaction } from '@/lib/db/queries';
import { formatCurrency } from '@/lib/format';
import type { Account, Category, Transaction } from '@/lib/db/schema';
import { layoutStyles } from '@/lib/layout';
import { useAppTheme, useTransactionTheme } from '@/lib/useAppTheme';

type Props = {
  transaction: Transaction;
  account?: Account;
  category?: Category;
  fromAccount?: Account;
  toAccount?: Account;
  goalName?: string;
  goalId?: string;
  goalContribution?: number;
  onPress?: () => void;
  onPressGoal?: (goalId: string) => void;
};

const TYPE_ICONS = {
  income: 'arrow-down-circle',
  expense: 'arrow-up-circle',
  transfer: 'swap-horizontal',
} as const;

const ACTION_WIDTH = 72;

export function TransactionRow({
  transaction,
  account,
  category,
  fromAccount,
  toAccount,
  goalName,
  goalId,
  goalContribution,
  onPress,
  onPressGoal,
}: Props) {
  const theme = useAppTheme();
  const { refresh } = useApp();
  const swipeRef = useRef<SwipeableMethods>(null);
  const actionInProgress = useRef(false);
  const canTogglePaid = transaction.type !== 'transfer';

  const handleTogglePaid = useCallback(async () => {
    if (actionInProgress.current) return;
    actionInProgress.current = true;
    try {
      await updateTransaction(transaction.id, { paid: !transaction.paid });
      refresh();
    } finally {
      actionInProgress.current = false;
      swipeRef.current?.close();
    }
  }, [refresh, transaction.id, transaction.paid]);

  const promptDelete = useCallback(() => {
    if (actionInProgress.current) return;
    Alert.alert('Delete transaction?', 'This action cannot be undone.', [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => swipeRef.current?.close(),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (actionInProgress.current) return;
          actionInProgress.current = true;
          try {
            await deleteTransaction(transaction.id);
            refresh();
          } finally {
            actionInProgress.current = false;
          }
        },
      },
    ]);
  }, [refresh, transaction.id]);

  const handleSwipeableOpen = useCallback(
    (direction: SwipeDirection.LEFT | SwipeDirection.RIGHT) => {
      if (direction === SwipeDirection.RIGHT && canTogglePaid) {
        void handleTogglePaid();
        return;
      }
      if (direction === SwipeDirection.LEFT) {
        promptDelete();
      }
    },
    [canTogglePaid, handleTogglePaid, promptDelete],
  );

  const renderPaidAction = useCallback(() => {
    const label = transaction.paid ? 'Mark unpaid' : 'Mark paid';
    const icon = transaction.paid ? 'clock-outline' : 'check-circle-outline';

    return (
      <View
        style={[
          styles.actionPanel,
          { width: ACTION_WIDTH, backgroundColor: theme.colors.primary },
        ]}
      >
        <MaterialCommunityIcons name={icon} size={22} color={theme.colors.onPrimary} />
        <Text variant="labelSmall" style={[styles.actionLabel, { color: theme.colors.onPrimary }]}>
          {label}
        </Text>
      </View>
    );
  }, [theme.colors.onPrimary, theme.colors.primary, transaction.paid]);

  const renderDeleteAction = useCallback(
    () => (
      <Pressable
        onPress={promptDelete}
        style={[
          styles.actionPanel,
          styles.actionPressable,
          { width: ACTION_WIDTH, backgroundColor: theme.colors.error },
        ]}
      >
        <MaterialCommunityIcons name="trash-can-outline" size={22} color={theme.colors.onError} />
        <Text variant="labelSmall" style={[styles.actionLabel, { color: theme.colors.onError }]}>
          Delete
        </Text>
      </Pressable>
    ),
    [promptDelete, theme.colors.error, theme.colors.onError],
  );

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      overshootFriction={8}
      leftThreshold={ACTION_WIDTH / 2}
      rightThreshold={ACTION_WIDTH / 2}
      renderLeftActions={canTogglePaid ? renderPaidAction : undefined}
      renderRightActions={renderDeleteAction}
      onSwipeableOpen={handleSwipeableOpen}
      containerStyle={styles.swipeContainer}
      childrenContainerStyle={{ backgroundColor: theme.colors.surface }}
    >
      <TransactionRowContent
        transaction={transaction}
        account={account}
        category={category}
        fromAccount={fromAccount}
        toAccount={toAccount}
        goalName={goalName}
        goalId={goalId}
        goalContribution={goalContribution}
        onPress={onPress}
        onPressGoal={onPressGoal}
      />
    </ReanimatedSwipeable>
  );
}

function TransactionRowContent({
  transaction,
  account,
  category,
  fromAccount,
  toAccount,
  goalName,
  goalId,
  goalContribution,
  onPress,
  onPressGoal,
}: Props) {
  const theme = useAppTheme();
  const typeColors = useTransactionTheme(transaction.type);
  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';
  const isUnpaid = transaction.type !== 'transfer' && !transaction.paid;
  const prefix = isIncome ? '+' : isExpense ? '-' : '';

  let title = transaction.note || format(new Date(transaction.date), 'HH:mm');
  if (transaction.type === 'transfer') {
    title = transaction.note || `${fromAccount?.name ?? '?'} → ${toAccount?.name ?? '?'}`;
  } else if (category) {
    title = transaction.note || category.name;
  } else if (account) {
    title = transaction.note || account.name;
  }

  const time = format(new Date(transaction.date), 'HH:mm');
  const metaParts = [account?.name, category?.name].filter(Boolean);
  const meta = metaParts.join(' · ');
  const description =
    transaction.type === 'transfer' ? `Transfer · ${time}` : meta ? `${meta} · ${time}` : time;

  const indicatorColor =
    transaction.type === 'transfer'
      ? typeColors.main
      : (category?.color ?? account?.color ?? typeColors.main);

  const contributionLabel =
    goalContribution !== undefined && goalContribution !== 0
      ? `${goalContribution > 0 ? '+' : ''}${formatCurrency(goalContribution)} toward goal`
      : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.surface },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={TYPE_ICONS[transaction.type]}
          size={20}
          color={typeColors.main}
        />
        <View
          style={[styles.categoryDot, { backgroundColor: indicatorColor, borderColor: theme.colors.surface }]}
        />
      </View>

      <View style={styles.body}>
        <Text variant="bodyLarge" style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
          {description}
        </Text>
        {isUnpaid ? (
          <Chip compact mode="outlined" style={styles.unpaidChip} textStyle={styles.unpaidChipText}>
            Unpaid
          </Chip>
        ) : null}
        {goalName && goalId ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onPressGoal?.(goalId);
            }}
          >
            <Chip compact icon="flag-outline" style={styles.goalChip}>
              {goalName}
            </Chip>
          </Pressable>
        ) : goalName ? (
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Goal: {goalName}
          </Text>
        ) : null}
        {contributionLabel ? (
          <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
            {contributionLabel}
          </Text>
        ) : null}
      </View>

      <Text style={[styles.amount, { color: typeColors.main }]}>
        {prefix}
        {formatCurrency(transaction.amount)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  swipeContainer: { overflow: 'hidden' },
  actionPanel: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  actionPressable: { height: '100%' },
  actionLabel: { textAlign: 'center', fontSize: 11 },
  row: layoutStyles.row,
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  body: layoutStyles.rowBody,
  title: { fontWeight: '600' },
  unpaidChip: { alignSelf: 'flex-start', marginTop: 2 },
  unpaidChipText: { fontSize: 11 },
  goalChip: { alignSelf: 'flex-start', marginTop: 2 },
  amount: { fontWeight: '600', fontVariant: ['tabular-nums'] },
});
