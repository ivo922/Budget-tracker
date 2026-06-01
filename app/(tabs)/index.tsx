import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { AddTransactionFab } from '@/components/AddTransactionFab';
import { BudgetEditorDialog } from '@/components/BudgetEditorDialog';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { SpendingDonut } from '@/components/SpendingDonut';
import { buildTransactionDaySections } from '@/components/TransactionGroupedList';
import { TransactionDayGroup } from '@/components/TransactionDayGroup';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import { useApp } from '@/lib/context/AppContext';
import {
  getAccountById,
  getCategoryById,
  getSpendingByCategory,
  getTotalNetBalance,
  getTransactions,
} from '@/lib/db/queries';
import type { CategorySpending } from '@/lib/db/queries';
import type { Account, Category, Transaction } from '@/lib/db/schema';
import { getPeriodRange } from '@/lib/periods';
import { layoutStyles } from '@/lib/layout';

type EnrichedTx = {
  tx: Transaction;
  account?: Account;
  category?: Category;
};

export default function DashboardScreen() {
  const router = useRouter();
  const { ready, refreshKey } = useApp();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyle } = useCollapsibleHeader();
  const [netBalance, setNetBalance] = useState(0);
  const [spending, setSpending] = useState<CategorySpending[]>([]);
  const [budgetDialogVisible, setBudgetDialogVisible] = useState(false);
  const [recent, setRecent] = useState<EnrichedTx[]>([]);
  const [loading, setLoading] = useState(true);
  const recentSections = useMemo(() => buildTransactionDaySections(recent), [recent]);

  const monthRange = useMemo(() => getPeriodRange('month'), [refreshKey]);

  const load = useCallback(async () => {
    setLoading(true);
    const now = Date.now();
    const [net, spend, txs] = await Promise.all([
      getTotalNetBalance(),
      getSpendingByCategory(0, now),
      getTransactions({ limit: 5 }),
    ]);
    setNetBalance(net);
    setSpending(spend);
    const enriched = await Promise.all(
      txs.map(async (tx) => ({
        tx,
        account: tx.accountId ? await getAccountById(tx.accountId) : undefined,
        category: tx.categoryId ? await getCategoryById(tx.categoryId) : undefined,
      })),
    );
    setRecent(enriched);
    setLoading(false);
  }, [refreshKey]);

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
      <CollapsibleScreenHeader
        title="Dashboard"
        scrollY={scrollY}
        headerHeight={headerHeight}
        leftAction="budget"
        onLeftPress={() => setBudgetDialogVisible(true)}
      />
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={scrollContentStyle}
      >
        <SpendingDonut
          data={spending}
          netAmount={netBalance}
          onPress={() => router.push('/analytics')}
        />

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
      <BudgetEditorDialog
        visible={budgetDialogVisible}
        year={new Date(monthRange.start).getFullYear()}
        month={new Date(monthRange.start).getMonth() + 1}
        onDismiss={() => {
          setBudgetDialogVisible(false);
          load();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 4,
  },
  recentList: { gap: 0 },
});
