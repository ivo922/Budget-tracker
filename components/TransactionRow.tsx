import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Text } from 'react-native-paper';
import { formatCurrency, formatDateShort } from '@/lib/format';
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

  let title = transaction.note || formatDateShort(transaction.date);
  if (transaction.type === 'transfer') {
    title = transaction.note || `${fromAccount?.name ?? '?'} → ${toAccount?.name ?? '?'}`;
  } else if (category) {
    title = transaction.note || category.name;
  } else if (account) {
    title = transaction.note || account.name;
  }

  const description =
    transaction.type === 'transfer'
      ? 'Transfer'
      : [account?.name, category?.name].filter(Boolean).join(' · ') || transaction.type;

  const indicatorColor =
    transaction.type === 'transfer'
      ? typeColors.main
      : (category?.color ?? account?.color ?? typeColors.main);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        {
          borderColor: typeColors.main,
          backgroundColor: pressed ? typeColors.container : 'transparent',
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: typeColors.container }]}>
        <MaterialCommunityIcons
          name={TYPE_ICONS[transaction.type]}
          size={18}
          color={typeColors.main}
        />
        <View
          style={[styles.categoryDot, { backgroundColor: indicatorColor, borderColor: theme.colors.background }]}
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
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  body: { flex: 1, gap: 2, minWidth: 0 },
  title: { fontWeight: '500' },
  amount: { fontWeight: '600', fontVariant: ['tabular-nums'] },
});
