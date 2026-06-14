import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ActivityIndicator, Text } from 'react-native-paper';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { TransactionGroupedList, type TransactionListItem } from '@/components/TransactionGroupedList';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import {
  getAccountBalance,
  getAccountById,
  getCategoryById,
  getGoals,
  getTransactions,
} from '@/lib/db/queries';
import type { Account } from '@/lib/db/schema';
import { formatCurrency } from '@/lib/format';
import { BORDER_RADIUS, layoutStyles, SCREEN_PADDING } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [account, setAccount] = useState<Account | null>(null);
  const [balance, setBalance] = useState(0);
  const [items, setItems] = useState<TransactionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const theme = useAppTheme();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyle } = useCollapsibleHeader();

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
    const [txs, goalRows] = await Promise.all([getTransactions({ accountId: id }), getGoals()]);
    const goalMap = new Map(goalRows.map((g) => [g.id, g.name]));
    const enriched = await Promise.all(
      txs.map(async (tx) => ({
        tx,
        account: acct,
        category: tx.categoryId ? await getCategoryById(tx.categoryId) : undefined,
        fromAccount: tx.fromAccountId ? await getAccountById(tx.fromAccountId) : undefined,
        toAccount: tx.toAccountId ? await getAccountById(tx.toAccountId) : undefined,
        goalName: tx.goalId ? goalMap.get(tx.goalId) : undefined,
      })),
    );
    setItems(enriched);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const accountHeader = useMemo(() => {
    if (!account) return null;
    return (
      <View
        style={[
          styles.accountCard,
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
    );
  }, [account, balance, theme.colors.onSurface, theme.colors.surface]);

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
      <CollapsibleScreenHeader
        title={account.name}
        scrollY={scrollY}
        headerHeight={headerHeight}
        leftAction="back"
        onLeftPress={() => router.back()}
      />
      {items.length === 0 ? (
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={[scrollContentStyle, styles.emptyScroll]}
        >
          {accountHeader}
          <EmptyState title="No transactions" message="Transactions for this account will appear here." />
        </Animated.ScrollView>
      ) : (
        <TransactionGroupedList
          items={items}
          extraData={items}
          contentContainerStyle={scrollContentStyle}
          ListHeaderComponent={accountHeader}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onPressItem={(txId) => router.push(`/transaction/${txId}`)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyScroll: { flexGrow: 1 },
  accountCard: {
    marginBottom: 8,
    padding: 16,
    borderWidth: 2,
    borderRadius: BORDER_RADIUS,
    gap: 4,
  },
  balance: { fontWeight: '700' },
});
