import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { formatCurrency } from '@/lib/format';
import type { Account } from '@/lib/db/schema';
import { layoutStyles } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  account: Account & { balance: number };
  onPress: () => void;
  onDelete?: () => void;
};

export function AccountListItem({ account, onPress, onDelete }: Props) {
  const theme = useAppTheme();
  const balanceColor =
    account.balance > 0
      ? theme.colors.income
      : account.balance < 0
        ? theme.colors.expense
        : theme.colors.onSurfaceVariant;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onDelete}
      style={({ pressed }) => [
        layoutStyles.row,
        { backgroundColor: pressed ? theme.colors.surfaceElevated : 'transparent' },
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
        <MaterialCommunityIcons name="wallet-outline" size={20} color={account.color} />
        <View
          style={[styles.colorDot, { backgroundColor: account.color, borderColor: theme.colors.surface }]}
        />
      </View>

      <View style={layoutStyles.rowBody}>
        <Text variant="bodyLarge" style={styles.title} numberOfLines={1}>
          {account.name}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
          Account · {formatCurrency(account.initialBalance)} starting
        </Text>
      </View>

      <Text style={[styles.balance, { color: balanceColor }]}>
        {formatCurrency(account.balance)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  title: { fontWeight: '600' },
  balance: { fontWeight: '600', fontVariant: ['tabular-nums'] },
});
