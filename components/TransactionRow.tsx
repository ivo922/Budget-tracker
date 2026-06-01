import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';
import { Text } from 'react-native-paper';
import { formatCurrency } from '@/lib/format';
import type { Account, Category, Transaction } from '@/lib/db/schema';
import { useAppTheme, useTransactionTheme } from '@/lib/useAppTheme';

type Props = {
  transaction: Transaction;
  account?: Account;
  category?: Category;
  fromAccount?: Account;
  toAccount?: Account;
  onPress?: () => void;
};

const TYPE_ICONS = {
  income: 'arrow-down-circle',
  expense: 'arrow-up-circle',
  transfer: 'swap-horizontal',
} as const;

export function TransactionRow({
  transaction,
  account,
  category,
  fromAccount,
  toAccount,
  onPress,
}: Props) {
  const theme = useAppTheme();
  const typeColors = useTransactionTheme(transaction.type);
  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';
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
  const meta = [account?.name, category?.name].filter(Boolean).join(' · ');
  const description =
    transaction.type === 'transfer' ? `Transfer · ${time}` : meta ? `${meta} · ${time}` : time;

  const indicatorColor =
    transaction.type === 'transfer'
      ? typeColors.main
      : (category?.color ?? account?.color ?? typeColors.main);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.colors.surfaceElevated : 'transparent' },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: typeColors.container }]}>
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
      </View>

      <Text style={[styles.amount, { color: typeColors.main }]}>
        {prefix}
        {formatCurrency(transaction.amount)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  body: { flex: 1, gap: 2, minWidth: 0 },
  title: { fontWeight: '600' },
  amount: { fontWeight: '600', fontVariant: ['tabular-nums'] },
});
