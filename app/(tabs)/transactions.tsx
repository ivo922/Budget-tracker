import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Chip, FAB, Menu } from 'react-native-paper';
import { EmptyState } from '@/components/EmptyState';
import { TransactionRow } from '@/components/TransactionRow';
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
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Chip icon="filter" onPress={() => setMenuVisible(true)}>
              {filterAccount
                ? accounts.find((a) => a.id === filterAccount)?.name ?? 'Account'
                : 'All accounts'}
            </Chip>
          }
        >
          <Menu.Item
            onPress={() => {
              setFilterAccount(undefined);
              setMenuVisible(false);
            }}
            title="All accounts"
          />
          {accounts.map((a) => (
            <Menu.Item
              key={a.id}
              onPress={() => {
                setFilterAccount(a.id);
                setMenuVisible(false);
              }}
              title={a.name}
            />
          ))}
        </Menu>
        {(['income', 'expense', 'transfer'] as const).map((t) => (
          <Chip
            key={t}
            selected={filterType === t}
            onPress={() => setFilterType(filterType === t ? undefined : t)}
          >
            {t}
          </Chip>
        ))}
      </View>

      {items.length === 0 ? (
        <EmptyState title="No transactions" message="Add income, expenses, or transfers to see them here." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.tx.id}
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

      <FAB icon="plus" style={styles.fab} onPress={() => router.push('/transaction/add')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
