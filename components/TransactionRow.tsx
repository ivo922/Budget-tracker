import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Text, useTheme } from 'react-native-paper';
import { formatCurrency, formatDateShort } from '@/lib/format';
import type { Account, Category, Transaction } from '@/lib/db/schema';

type Props = {
  transaction: Transaction;
  account?: Account;
  category?: Category;
  fromAccount?: Account;
  toAccount?: Account;
  onPress?: () => void;
};

export function TransactionRow({
  transaction,
  account,
  category,
  fromAccount,
  toAccount,
  onPress,
}: Props) {
  const theme = useTheme();
  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';
  const amountColor = isIncome ? '#2E7D32' : isExpense ? '#C62828' : theme.colors.primary;
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

  return (
    <List.Item
      title={title}
      description={description}
      onPress={onPress}
      left={() => (
        <View style={[styles.dot, { backgroundColor: category?.color ?? account?.color ?? theme.colors.primary }]} />
      )}
      right={() => (
        <Text style={{ color: amountColor, alignSelf: 'center', fontWeight: '600' }}>
          {prefix}
          {formatCurrency(transaction.amount)}
        </Text>
      )}
    />
  );
}

const styles = StyleSheet.create({
  dot: { width: 10, height: 10, borderRadius: 5, alignSelf: 'center', marginLeft: 8 },
});
