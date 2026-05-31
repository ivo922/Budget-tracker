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

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<
    { tx: Transaction; category?: Category }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
    <View style={styles.container}>
      <View style={[styles.header, { borderLeftColor: account.color }]}>
        <Text variant="headlineSmall">{account.name}</Text>
        <Text variant="titleLarge" style={styles.balance}>
          {formatCurrency(balance)}
        </Text>
      </View>
      {transactions.length === 0 ? (
        <EmptyState title="No transactions" message="Transactions for this account will appear here." />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.tx.id}
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
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: 16, borderLeftWidth: 4, margin: 16, backgroundColor: 'rgba(0,0,0,0.03)' },
  balance: { fontWeight: '700', marginTop: 4 },
});
