import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { BORDER_RADIUS } from '@/lib/layout';
import { formatCurrency } from '@/lib/format';
import type { Account } from '@/lib/db/schema';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  account: Account & { balance: number };
  onPress: () => void;
  onDelete: () => void;
};

export function AccountListItem({ account, onPress, onDelete }: Props) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: account.color,
          backgroundColor: theme.colors.surface,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: account.color }]} />
      <View style={styles.text}>
        <Text variant="titleMedium">{account.name}</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {formatCurrency(account.balance)}
        </Text>
      </View>
      <IconButton icon="delete" onPress={onDelete} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: BORDER_RADIUS,
    paddingVertical: 4,
    paddingLeft: 12,
    paddingRight: 4,
    marginBottom: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: BORDER_RADIUS,
    marginRight: 12,
  },
  text: { flex: 1, gap: 2 },
});
