import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Chip } from 'react-native-paper';
import { AddTransactionFab } from '@/components/AddTransactionFab';
import { EmptyState } from '@/components/EmptyState';
import { ThemedMenu, ThemedMenuItem } from '@/components/ThemedMenu';
import { TransactionRow } from '@/components/TransactionRow';
import { TransactionTypeChip } from '@/components/TransactionTypeChip';
import { useApp } from '@/lib/context/AppContext';
import {
  getAccountById,
  getAccounts,
  getCategories,
  getCategoryById,
  getTransactions,
} from '@/lib/db/queries';
import type { Account, Category, Transaction } from '@/lib/db/schema';

type EnrichedTx = {
  tx: Transaction;
  account?: Account;
  category?: Category;
  fromAccount?: Account;
  toAccount?: Account;
};

export default function TransactionsScreen() {
  const router = useRouter();
  const { ready } = useApp();
  const [items, setItems] = useState<EnrichedTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAccount, setFilterAccount] = useState<string | undefined>();
  const [filterType, setFilterType] = useState<'income' | 'expense' | 'transfer' | undefined>();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const txs = await getTransactions({
      accountId: filterAccount,
      type: filterType,
    });
    const enriched = await Promise.all(
      txs.map(async (tx) => ({
        tx,
        account: tx.accountId ? await getAccountById(tx.accountId) : undefined,
        category: tx.categoryId ? await getCategoryById(tx.categoryId) : undefined,
        fromAccount: tx.fromAccountId ? await getAccountById(tx.fromAccountId) : undefined,
        toAccount: tx.toAccountId ? await getAccountById(tx.toAccountId) : undefined,
      })),
    );
    setItems(enriched);
    setLoading(false);
  }, [filterAccount, filterType]);

  useFocusEffect(
    useCallback(() => {
      if (ready) {
        getAccounts().then(setAccounts);
        load();
      }
    }, [ready, load]),
  );

  if (!ready || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <ThemedMenu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Chip icon="filter" onPress={() => setMenuVisible(true)} showSelectedCheck={false}>
              {filterAccount
                ? accounts.find((a) => a.id === filterAccount)?.name ?? 'Account'
                : 'All accounts'}
            </Chip>
          }
        >
          <ThemedMenuItem
            onPress={() => {
              setFilterAccount(undefined);
              setMenuVisible(false);
            }}
            title="All accounts"
          />
          {accounts.map((a) => (
            <ThemedMenuItem
              key={a.id}
              onPress={() => {
                setFilterAccount(a.id);
                setMenuVisible(false);
              }}
              title={a.name}
            />
          ))}
        </ThemedMenu>
        {(['income', 'expense', 'transfer'] as const).map((t) => (
          <TransactionTypeChip
            key={t}
            type={t}
            selected={filterType === t}
            onPress={() => setFilterType(filterType === t ? undefined : t)}
          />
        ))}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState title="No transactions" message="Tap + to add income, expenses, or transfers." />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.tx.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TransactionRow
              transaction={item.tx}
              account={item.account}
              category={item.category}
              fromAccount={item.fromAccount}
              toAccount={item.toAccount}
              onPress={() => router.push(`/transaction/${item.tx.id}`)}
            />
          )}
        />
      )}

      <AddTransactionFab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  emptyWrap: { flex: 1, paddingHorizontal: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 88 },
});
