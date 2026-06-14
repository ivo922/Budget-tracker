import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ActivityIndicator, ProgressBar, Text } from 'react-native-paper';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { GoalContributionChart } from '@/components/GoalContributionChart';
import { TransactionGroupedList, type TransactionListItem } from '@/components/TransactionGroupedList';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import {
  getAccountBalance,
  getAccountById,
  getCategoryById,
  getGoalContributionTimeline,
  getGoalProgress,
  getGoalTransactions,
} from '@/lib/db/queries';
import type { GoalProgress, GoalTimelinePoint } from '@/lib/db/queries';
import type { Account } from '@/lib/db/schema';
import { formatCurrency } from '@/lib/format';
import { BORDER_RADIUS, layoutStyles, SCREEN_PADDING } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyle } = useCollapsibleHeader();
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [linkedAccount, setLinkedAccount] = useState<Account | null>(null);
  const [accountBalance, setAccountBalance] = useState(0);
  const [items, setItems] = useState<TransactionListItem[]>([]);
  const [timeline, setTimeline] = useState<GoalTimelinePoint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const goalProgress = await getGoalProgress(id);
    if (!goalProgress) {
      setLoading(false);
      return;
    }
    setProgress(goalProgress);

    let account: Account | null = null;
    if (goalProgress.goal.accountId && goalProgress.goal.type === 'savings') {
      account = (await getAccountById(goalProgress.goal.accountId)) ?? null;
      if (account) {
        setAccountBalance(await getAccountBalance(account.id));
      }
    }
    setLinkedAccount(account);

    const txs = await getGoalTransactions(id);
    const goalName = goalProgress.goal.name;
    const enriched = await Promise.all(
      txs.map(async (tx) => ({
        tx,
        account: tx.accountId ? await getAccountById(tx.accountId) : undefined,
        category: tx.categoryId ? await getCategoryById(tx.categoryId) : undefined,
        fromAccount: tx.fromAccountId ? await getAccountById(tx.fromAccountId) : undefined,
        toAccount: tx.toAccountId ? await getAccountById(tx.toAccountId) : undefined,
        goalName,
      })),
    );
    setItems(enriched);
    setTimeline(await getGoalContributionTimeline(id));
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const listHeader = useMemo(() => {
    if (!progress) return null;
    const { goal, progress: amount, remaining, percent } = progress;
    const isLoan = goal.type === 'loan';

    return (
      <View style={styles.headerBlock}>
        <View
          style={[
            styles.heroCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
          ]}
        >
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {isLoan ? 'Loan' : 'Savings'}
            {goal.status === 'completed' ? ' · Completed' : ''}
          </Text>
          <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
            {formatCurrency(amount)} of {formatCurrency(goal.targetAmount)}
          </Text>
          <ProgressBar
            progress={percent / 100}
            color={isLoan ? theme.colors.transfer : theme.colors.income}
            style={styles.bar}
          />
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {goal.status === 'completed'
              ? 'Target reached'
              : `${Math.round(percent)}% · ${formatCurrency(remaining)} ${isLoan ? 'left to pay' : 'to go'}`}
          </Text>
        </View>

        {linkedAccount ? (
          <Pressable
            onPress={() => router.push(`/account/${linkedAccount.id}`)}
            style={[
              styles.accountCard,
              {
                borderColor: linkedAccount.color,
                backgroundColor: theme.colors.surface,
              },
            ]}
          >
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Linked account
            </Text>
            <Text variant="titleMedium" style={{ fontWeight: '600' }}>
              {linkedAccount.name}
            </Text>
            <Text variant="bodyLarge" style={{ fontWeight: '700' }}>
              {formatCurrency(accountBalance)}
            </Text>
          </Pressable>
        ) : !isLoan ? (
          <View style={[styles.hintCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Link an account to auto-track transactions toward this goal.
            </Text>
          </View>
        ) : null}

        <GoalContributionChart
          data={timeline}
          goalType={goal.type}
          targetAmount={goal.targetAmount}
        />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Contributions
        </Text>
      </View>
    );
  }, [progress, linkedAccount, accountBalance, timeline, theme, router]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!progress) {
    return <EmptyState title="Goal not found" message="This goal may have been deleted." />;
  }

  return (
    <View style={layoutStyles.screen}>
      <CollapsibleScreenHeader
        title={progress.goal.name}
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
          {listHeader}
          <EmptyState
            title="No contributions yet"
            message={
              progress.goal.type === 'savings' && progress.goal.accountId
                ? 'Add an income or expense on the linked account to track progress.'
                : progress.goal.type === 'savings'
                  ? 'Link an account or assign transactions manually.'
                  : 'Link expense transactions when adding payments.'
            }
          />
        </Animated.ScrollView>
      ) : (
        <TransactionGroupedList
          items={items}
          extraData={items}
          contentContainerStyle={scrollContentStyle}
          ListHeaderComponent={listHeader}
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
  emptyScroll: { flexGrow: 1, paddingBottom: SCREEN_PADDING },
  headerBlock: { gap: 12, marginBottom: 8 },
  heroCard: {
    padding: 16,
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    gap: 8,
  },
  bar: { height: 8, borderRadius: BORDER_RADIUS },
  accountCard: {
    padding: 16,
    borderRadius: BORDER_RADIUS,
    borderWidth: 2,
    gap: 4,
  },
  hintCard: {
    padding: 12,
    borderRadius: BORDER_RADIUS,
  },
  sectionTitle: { fontWeight: '600', marginTop: 4 },
});
