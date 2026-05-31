import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { AddTransactionFab } from '@/components/AddTransactionFab';
import { BalanceCard } from '@/components/BalanceCard';
import { EmptyState } from '@/components/EmptyState';
import { PeriodSelector } from '@/components/PeriodSelector';
import { TransactionRow } from '@/components/TransactionRow';
import { useApp } from '@/lib/context/AppContext';
import { useAppTheme } from '@/lib/useAppTheme';
import {
  getAccountById,
  getCategoryById,
  getPeriodSummary,
  getTransactions,
} from '@/lib/db/queries';
import type { Account, Category, Transaction } from '@/lib/db/schema';

type EnrichedTx = {
  tx: Transaction;
  account?: Account;
  category?: Category;
};

export default function DashboardScreen() {
  const router = useRouter();
  const { ready, period, periodRange, setPeriod, refreshKey } = useApp();
  const theme = useAppTheme();
  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0 });
  const [recent, setRecent] = useState<EnrichedTx[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const s = await getPeriodSummary(periodRange.start, periodRange.end);
    setSummary(s);
    const txs = await getTransactions({ limit: 5 });
    const enriched = await Promise.all(
      txs.map(async (tx) => ({
        tx,
        account: tx.accountId ? await getAccountById(tx.accountId) : undefined,
        category: tx.categoryId ? await getCategoryById(tx.categoryId) : undefined,
      })),
    );
    setRecent(enriched);
    setLoading(false);
  }, [periodRange.start, periodRange.end, refreshKey]);

  useFocusEffect(
    useCallback(() => {
      if (ready) load();
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
      <ScrollView contentContainerStyle={styles.content}>
        <PeriodSelector value={period} onChange={setPeriod} />
        <Text variant="labelLarge" style={[styles.section, { color: theme.colors.onSurfaceVariant }]}>
          {periodRange.label}
        </Text>
        <View style={styles.cards}>
          <View style={styles.cardsRow}>
            <BalanceCard compact label="Income" amount={summary.income} variant="income" />
            <BalanceCard compact label="Expenses" amount={summary.expense} variant="expense" />
          </View>
          <BalanceCard compact fullWidth label="Net" amount={summary.net} variant="net" />
        </View>

        <Text variant="titleMedium" style={styles.section}>
          Recent transactions
        </Text>
        {recent.length === 0 ? (
          <EmptyState title="No transactions yet" message="Tap + to add your first transaction." />
        ) : (
          <View style={styles.recentList}>
            {recent.map(({ tx, account, category }) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                account={account}
                category={category}
                onPress={() => router.push(`/transaction/${tx.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
      <AddTransactionFab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 88, gap: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cards: { gap: 8 },
  cardsRow: { flexDirection: 'row', gap: 8 },
  section: { marginTop: 12, marginBottom: 4 },
  recentList: { gap: 0 },
});
