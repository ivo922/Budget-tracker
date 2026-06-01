import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { layoutStyles, screenScrollContentStyle } from '@/lib/layout';
import { AddTransactionFab } from '@/components/AddTransactionFab';
import { BalanceCard } from '@/components/BalanceCard';
import { BudgetEditorDialog } from '@/components/BudgetEditorDialog';
import { BudgetSummary } from '@/components/BudgetSummary';
import { CategoryBreakdownRow } from '@/components/CategoryBreakdownRow';
import { EmptyState } from '@/components/EmptyState';
import { PeriodSelector } from '@/components/PeriodSelector';
import { SpendingDonut } from '@/components/SpendingDonut';
import { buildTransactionDaySections } from '@/components/TransactionGroupedList';
import { TransactionDayGroup } from '@/components/TransactionDayGroup';
import { useApp } from '@/lib/context/AppContext';
import { useAppTheme } from '@/lib/useAppTheme';
import {
  getAccountById,
  getBudgetVsActual,
  getCategoryById,
  getPeriodSummary,
  getSpendingByCategory,
  getTransactions,
} from '@/lib/db/queries';
import type { BudgetVsActual, CategorySpending } from '@/lib/db/queries';
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
  const [spending, setSpending] = useState<CategorySpending[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetVsActual | null>(null);
  const [budgetDialogVisible, setBudgetDialogVisible] = useState(false);
  const [recent, setRecent] = useState<EnrichedTx[]>([]);
  const [loading, setLoading] = useState(true);
  const recentSections = useMemo(() => buildTransactionDaySections(recent), [recent]);

  const load = useCallback(async () => {
    setLoading(true);
    const s = await getPeriodSummary(periodRange.start, periodRange.end);
    setSummary(s);
    const spend = await getSpendingByCategory(periodRange.start, periodRange.end);
    setSpending(spend);
    if (period === 'month') {
      const ref = new Date(periodRange.start);
      const budget = await getBudgetVsActual(
        ref.getFullYear(),
        ref.getMonth() + 1,
        periodRange.start,
        periodRange.end,
      );
      setBudgetSummary(budget);
    } else {
      setBudgetSummary(null);
    }
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
  }, [period, periodRange.start, periodRange.end, refreshKey]);

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
    <View style={layoutStyles.screen}>
      <ScrollView contentContainerStyle={screenScrollContentStyle}>
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

        {spending.length > 0 ? (
          <>
            <Text variant="titleMedium" style={styles.section}>
              Spending breakdown
            </Text>
            <View style={styles.chartRow}>
              <SpendingDonut data={spending} />
              <CategoryBreakdownRow data={spending} />
            </View>
          </>
        ) : null}

        {period === 'month' && budgetSummary ? (
          <>
            <View style={styles.budgetHeader}>
              <Text variant="titleMedium">Budget</Text>
              <Button compact onPress={() => setBudgetDialogVisible(true)}>
                Edit
              </Button>
            </View>
            <BudgetSummary summary={budgetSummary} />
          </>
        ) : null}

        <View style={styles.recentHeader}>
          <Text variant="titleMedium">Recent transactions</Text>
          <Button compact mode="text" onPress={() => router.push('/transactions')}>
            View all
          </Button>
        </View>
        {recent.length === 0 ? (
          <EmptyState title="No transactions yet" message="Tap + to add your first transaction." />
        ) : (
          <View style={styles.recentList}>
            {recentSections.map((section) => (
              <TransactionDayGroup
                key={section.key}
                section={section}
                onPressItem={(txId) => router.push(`/transaction/${txId}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
      <AddTransactionFab />
      {period === 'month' ? (
        <BudgetEditorDialog
          visible={budgetDialogVisible}
          year={new Date(periodRange.start).getFullYear()}
          month={new Date(periodRange.start).getMonth() + 1}
          onDismiss={() => {
            setBudgetDialogVisible(false);
            load();
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cards: { gap: 8 },
  cardsRow: { flexDirection: 'row', gap: 8 },
  chartRow: { gap: 4 },
  budgetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  section: { marginTop: 12, marginBottom: 4 },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 4,
  },
  recentList: { gap: 0 },
});
