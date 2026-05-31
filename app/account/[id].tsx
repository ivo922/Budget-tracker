import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { EmptyState } from '@/components/EmptyState';
import { TransactionRow } from '@/components/TransactionRow';
import {
  getAccountBalance,
  getAccountById,
  getCategoryById,
  getTransactions,
} from '@/lib/db/queries';
import type { Account, Category, Transaction } from '@/lib/db/schema';
import { formatCurrency } from '@/lib/format';
import { BORDER_RADIUS, layoutStyles, screenListContentStyle, SCREEN_PADDING } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<
    { tx: Transaction; category?: Category }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const theme = useAppTheme();

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const acct = await getAccountById(id);
    if (!acct) {
      setLoading(false);
      return;
    }
    setAccount(acct);
    setBalance(await getAccountBalance(id));
    const txs = await getTransactions({ accountId: id });
    const enriched = await Promise.all(
      txs.map(async (tx) => ({
        tx,
        category: tx.categoryId ? await getCategoryById(tx.categoryId) : undefined,
      })),
    );
    setTransactions(enriched);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!account) {
    return <EmptyState title="Account not found" message="This account may have been deleted." />;
  }

  return (
    <View style={layoutStyles.screen}>
      <View
        style={[
          styles.header,
          {
            borderColor: account.color,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
          {account.name}
        </Text>
        <Text variant="titleLarge" style={[styles.balance, { color: theme.colors.onSurface }]}>
          {formatCurrency(balance)}
        </Text>
      </View>
      {transactions.length === 0 ? (
        <View style={screenListContentStyle}>
          <EmptyState title="No transactions" message="Transactions for this account will appear here." />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.tx.id}
          contentContainerStyle={screenListContentStyle}
          renderItem={({ item }) => (
            <TransactionRow
              transaction={item.tx}
              account={account}
              category={item.category}
              onPress={() => router.push(`/transaction/${item.tx.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    marginHorizontal: SCREEN_PADDING,
    marginTop: SCREEN_PADDING,
    marginBottom: 8,
    padding: 16,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS,
    gap: 4,
  },
  balance: { fontWeight: '700' },
});
