import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { AddTransactionFab } from '@/components/AddTransactionFab';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { MonthSummaryCard } from '@/components/MonthSummaryCard';
import { buildTransactionDaySections } from '@/components/TransactionGroupedList';
import { TransactionDayGroup } from '@/components/TransactionDayGroup';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import { useApp } from '@/lib/context/AppContext';
import {
  getAccountById,
  getCategoryById,
  getPeriodSummary,
  getTransactions,
} from '@/lib/db/queries';
import type { Account, Category, Transaction } from '@/lib/db/schema';
import type { DashboardPeriod } from '@/lib/periods';
import { getDashboardPeriodRange, getPeriodRange } from '@/lib/periods';
import { layoutStyles } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type EnrichedTx = {
  tx: Transaction;
  account?: Account;
  category?: Category;
};

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { ready, refreshKey } = useApp();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyle } = useCollapsibleHeader();
  const [period, setPeriod] = useState<DashboardPeriod>('this_month');
  const [summary, setSummary] = useState({ income: 0, expense: 0 });
  const [recent, setRecent] = useState<EnrichedTx[]>([]);
  const [loading, setLoading] = useState(true);
  const recentSections = useMemo(() => buildTransactionDaySections(recent), [recent]);

  const monthRange = useMemo(() => getPeriodRange('month'), [refreshKey]);

  const openBudgets = () => {
    const d = new Date(monthRange.start);
    router.push({
      pathname: '/budgets/edit',
      params: {
        year: String(d.getFullYear()),
        month: String(d.getMonth() + 1),
      },
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    const range = getDashboardPeriodRange(period);
    const [periodSummary, txs] = await Promise.all([
      getPeriodSummary(range.start, range.end),
      getTransactions({ limit: 5 }),
    ]);
    setSummary(periodSummary);
    const enriched = await Promise.all(
      txs.map(async (tx) => ({
        tx,
        account: tx.accountId ? await getAccountById(tx.accountId) : undefined,
        category: tx.categoryId ? await getCategoryById(tx.categoryId) : undefined,
      })),
    );
    setRecent(enriched);
    setLoading(false);
  }, [refreshKey, period]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  if (!ready || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={layoutStyles.screen}>
      <CollapsibleScreenHeader title="Dashboard" scrollY={scrollY} headerHeight={headerHeight} />
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={scrollContentStyle}
      >
        <MonthSummaryCard
          period={period}
          onPeriodChange={setPeriod}
          income={summary.income}
          expense={summary.expense}
        />

        <View style={styles.actionsRow}>
          <Button
            mode="text"
            icon="wallet-outline"
            onPress={openBudgets}
            compact
            labelStyle={styles.headerActionLabel}
            textColor={theme.colors.onSurface}
          >
            Budget
          </Button>
          <Button
            mode="text"
            icon="chart-line"
            onPress={() => router.push('/analytics')}
            compact
            labelStyle={styles.headerActionLabel}
            textColor={theme.colors.onSurface}
          >
            Analytics
          </Button>
        </View>

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
      </Animated.ScrollView>
      <AddTransactionFab />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerActionLabel: {
    marginHorizontal: 0,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recentList: { gap: 0 },
});
