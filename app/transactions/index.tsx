import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Chip, Text } from 'react-native-paper';
import { AddTransactionFab } from '@/components/AddTransactionFab';
import { EmptyState } from '@/components/EmptyState';
import { ThemedMenu, ThemedMenuItem } from '@/components/ThemedMenu';
import { TransactionRow } from '@/components/TransactionRow';
import { TransactionTypeChip } from '@/components/TransactionTypeChip';
import { useApp } from '@/lib/context/AppContext';
import {
  getAccountById,
  getAccounts,
  getCategoryById,
  getTransactions,
} from '@/lib/db/queries';
import type { Account, Category, Transaction } from '@/lib/db/schema';
import { groupByMonth, monthSectionLabel } from '@/lib/groupTransactions';
import { layoutStyles, screenListContentStyle, SCREEN_PADDING } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type EnrichedTx = {
  tx: Transaction;
  account?: Account;
  category?: Category;
  fromAccount?: Account;
  toAccount?: Account;
};

type EnrichedWithDate = EnrichedTx & { date: number };

type TxSection = {
  title: string;
  data: EnrichedTx[];
};

export default function AllTransactionsScreen() {
  const router = useRouter();
  const { ready, refreshKey } = useApp();
  const theme = useAppTheme();
  const [sections, setSections] = useState<TxSection[]>([]);
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
    const withDate: EnrichedWithDate[] = enriched.map((e) => ({ ...e, date: e.tx.date }));
    const grouped = groupByMonth(withDate);
    setSections(
      grouped.map((g) => ({
        title: monthSectionLabel(g.key),
        data: g.data,
      })),
    );
    setLoading(false);
  }, [filterAccount, filterType, refreshKey]);

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
    <View style={layoutStyles.screen}>
      <View style={layoutStyles.filtersRow}>
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

      {sections.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState title="No transactions" message="Tap + to add income, expenses, or transfers." />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.tx.id}
          contentContainerStyle={screenListContentStyle}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section: { title } }) => (
            <Text
              variant="titleSmall"
              style={[
                styles.sectionHeader,
                { backgroundColor: theme.colors.background, color: theme.colors.onSurfaceVariant },
              ]}
            >
              {title}
            </Text>
          )}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, padding: SCREEN_PADDING },
  sectionHeader: { paddingTop: 8, paddingBottom: 8, fontWeight: '600' },
});
