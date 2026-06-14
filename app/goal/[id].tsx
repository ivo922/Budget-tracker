import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ActivityIndicator, Button, Chip, ProgressBar, Text } from 'react-native-paper';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { GoalContributionChart } from '@/components/GoalContributionChart';
import { ThemedMenu, ThemedMenuItem } from '@/components/ThemedMenu';
import { TransactionGroupedList, type TransactionListItem } from '@/components/TransactionGroupedList';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import { useApp } from '@/lib/context/AppContext';
import {
  archiveGoal,
  getAccountBalance,
  getAccountById,
  getCategoryById,
  getGoalContributionTimeline,
  getGoalProgress,
  getGoalStats,
  getGoalTransactions,
  signedGoalContribution,
} from '@/lib/db/queries';
import type { GoalProgress, GoalStats, GoalTimelinePoint } from '@/lib/db/queries';
import type { Account } from '@/lib/db/schema';
import { formatCurrency } from '@/lib/format';
import { computeGoalPace } from '@/lib/goalPace';
import { HEADER_CONTENT_HEIGHT } from '@/lib/collapsibleHeader';
import { BORDER_RADIUS, layoutStyles, SCREEN_PADDING } from '@/lib/layout';
import { navigateToConfirm } from '@/lib/navigateConfirm';
import { useAppTheme } from '@/lib/useAppTheme';

type ContributionFilter = 'all' | 'positive' | 'negative';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { refresh } = useApp();
  const theme = useAppTheme();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyle } = useCollapsibleHeader();
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const [linkedAccount, setLinkedAccount] = useState<Account | null>(null);
  const [accountBalance, setAccountBalance] = useState(0);
  const [items, setItems] = useState<TransactionListItem[]>([]);
  const [timeline, setTimeline] = useState<GoalTimelinePoint[]>([]);
  const [contributionFilter, setContributionFilter] = useState<ContributionFilter>('all');
  const [menuVisible, setMenuVisible] = useState(false);
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

    const [txs, timelineData, goalStats] = await Promise.all([
      getGoalTransactions(id),
      getGoalContributionTimeline(id),
      getGoalStats(id),
    ]);
    setTimeline(timelineData);
    setStats(goalStats);

    const goalName = goalProgress.goal.name;
    const enriched = await Promise.all(
      txs.map(async (tx) => ({
        tx,
        account: tx.accountId ? await getAccountById(tx.accountId) : undefined,
        category: tx.categoryId ? await getCategoryById(tx.categoryId) : undefined,
        fromAccount: tx.fromAccountId ? await getAccountById(tx.fromAccountId) : undefined,
        toAccount: tx.toAccountId ? await getAccountById(tx.toAccountId) : undefined,
        goalName,
        goalId: goalProgress.goal.id,
        goalContribution: signedGoalContribution(tx, goalProgress.goal),
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

  const pace = useMemo(
    () => (progress ? computeGoalPace(progress, timeline) : null),
    [progress, timeline],
  );

  const filteredItems = useMemo(() => {
    if (contributionFilter === 'all') return items;
    if (contributionFilter === 'positive') {
      return items.filter((item) => (item.goalContribution ?? 0) > 0);
    }
    return items.filter((item) => (item.goalContribution ?? 0) < 0);
  }, [contributionFilter, items]);

  const progressDiffersFromAccount =
    linkedAccount &&
    progress &&
    Math.abs(progress.progress - (accountBalance + progress.goal.startingBalance)) > 0.01;

  const handleArchive = async () => {
    if (!id) return;
    setMenuVisible(false);
    await archiveGoal(id);
    refresh();
    router.back();
  };

  const handleDelete = () => {
    if (!id || !progress) return;
    setMenuVisible(false);
    navigateToConfirm(router, {
      type: 'goal',
      id,
      title: 'Delete goal?',
      message: 'Linked transactions will be unlinked. This cannot be undone.',
      dismiss: 2,
    });
  };

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
            {goal.status === 'archived' ? ' · Archived' : ''}
          </Text>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Goal progress
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
          {pace?.dueLabel ? (
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {pace.dueLabel}
            </Text>
          ) : null}
          {pace?.label ? (
            <Text
              variant="labelSmall"
              style={{
                color:
                  pace.status === 'behind'
                    ? theme.colors.error
                    : pace.status === 'ahead'
                      ? theme.colors.income
                      : theme.colors.onSurfaceVariant,
              }}
            >
              {pace.label}
            </Text>
          ) : null}
        </View>

        {stats ? (
          <View style={styles.statsRow}>
            <StatPill label="Starting" value={formatCurrency(stats.startingBalance)} />
            <StatPill label="This month" value={formatCurrency(stats.thisMonthContribution)} />
            <StatPill label="Avg / mo" value={formatCurrency(stats.averageMonthlyContribution)} />
            <StatPill label="Transactions" value={String(stats.transactionCount)} />
          </View>
        ) : null}

        {linkedAccount ? (
          <View style={styles.accountSection}>
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
              <View style={styles.accountCardHeader}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Linked account
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
              </View>
              <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                {linkedAccount.name}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Account balance
              </Text>
              <Text variant="bodyLarge" style={{ fontWeight: '700' }}>
                {formatCurrency(accountBalance)}
              </Text>
            </Pressable>
            {progressDiffersFromAccount ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                Goal progress includes starting balance and net linked transactions, which may differ
                from the account balance.
              </Text>
            ) : null}
            {goal.status === 'active' ? (
              <Button
                mode="text"
                compact
                onPress={() => router.push(`/goal/link/${goal.id}`)}
                style={styles.changeAccountButton}
              >
                Change linked account
              </Button>
            ) : null}
          </View>
        ) : !isLoan && goal.status === 'active' ? (
          <Pressable
            onPress={() => router.push(`/goal/link/${goal.id}`)}
            style={[styles.hintCard, { backgroundColor: theme.colors.surfaceVariant }]}
          >
            <View style={styles.hintRow}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                Link an account to auto-track transactions toward this goal.
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
          </Pressable>
        ) : !isLoan ? (
          <View style={[styles.hintCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Link an account to auto-track transactions toward this goal.
            </Text>
          </View>
        ) : isLoan && goal.status === 'active' ? (
          <View style={[styles.hintCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Link expense transactions when adding payments to track loan payoff.
            </Text>
          </View>
        ) : null}

        <GoalContributionChart
          data={timeline}
          goalType={goal.type}
          targetAmount={goal.targetAmount}
          targetDate={goal.targetDate}
          createdAt={goal.createdAt}
          startingBalance={goal.startingBalance}
        />

        <View style={styles.contributionHeader}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Contributions
          </Text>
          {!isLoan ? (
            <View style={styles.filterChips}>
              {(['all', 'positive', 'negative'] as ContributionFilter[]).map((key) => (
                <Chip
                  key={key}
                  compact
                  selected={contributionFilter === key}
                  onPress={() => setContributionFilter(key)}
                  showSelectedCheck={false}
                >
                  {key === 'all' ? 'All' : key === 'positive' ? 'Deposits' : 'Withdrawals'}
                </Chip>
              ))}
            </View>
          ) : (
            <Chip
              compact
              selected={contributionFilter === 'positive'}
              onPress={() =>
                setContributionFilter((f) => (f === 'positive' ? 'all' : 'positive'))
              }
              showSelectedCheck={false}
            >
              Payments only
            </Chip>
          )}
        </View>
      </View>
    );
  }, [
    progress,
    stats,
    linkedAccount,
    accountBalance,
    timeline,
    theme,
    router,
    pace,
    progressDiffersFromAccount,
    contributionFilter,
  ]);

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
        rightAction="more"
        onRightPress={() => setMenuVisible(true)}
      />
      <View
        style={[styles.menuAnchor, { top: headerHeight - HEADER_CONTENT_HEIGHT }]}
        pointerEvents="none"
      >
        <ThemedMenu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<View style={styles.hiddenMenuAnchor} />}
        >
          <ThemedMenuItem
            title="Edit"
            onPress={() => {
              setMenuVisible(false);
              router.push(`/goal/edit/${id}`);
            }}
          />
          {progress.goal.status === 'completed' || progress.goal.status === 'active' ? (
            <ThemedMenuItem title="Archive" onPress={handleArchive} />
          ) : null}
          <ThemedMenuItem title="Delete" onPress={handleDelete} />
        </ThemedMenu>
      </View>
      {filteredItems.length === 0 ? (
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
          {progress.goal.status === 'active' ? (
            <Button mode="contained" onPress={() => router.push('/transaction/add')} style={styles.addTx}>
              Add transaction
            </Button>
          ) : null}
        </Animated.ScrollView>
      ) : (
        <TransactionGroupedList
          items={filteredItems}
          extraData={filteredItems}
          contentContainerStyle={scrollContentStyle}
          ListHeaderComponent={listHeader}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onPressItem={(txId) => router.push(`/transaction/${txId}`)}
          onPressGoal={(goalId) => router.push(`/goal/${goalId}`)}
        />
      )}
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.statPill, { backgroundColor: theme.colors.surfaceVariant }]}>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      <Text variant="labelLarge" style={{ fontWeight: '700' }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyScroll: { flexGrow: 1, paddingBottom: SCREEN_PADDING },
  addTx: { marginHorizontal: SCREEN_PADDING, marginTop: 8 },
  headerBlock: { gap: 12, marginBottom: 8 },
  heroCard: {
    padding: 16,
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    gap: 8,
  },
  bar: { height: 8, borderRadius: BORDER_RADIUS },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statPill: {
    flexGrow: 1,
    flexBasis: '45%',
    padding: 10,
    borderRadius: BORDER_RADIUS,
    gap: 2,
  },
  accountSection: { gap: 0 },
  accountCard: {
    padding: 16,
    borderRadius: BORDER_RADIUS,
    borderWidth: 2,
    gap: 4,
  },
  accountCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changeAccountButton: { alignSelf: 'flex-start', marginTop: -4 },
  hintCard: {
    padding: 12,
    borderRadius: BORDER_RADIUS,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contributionHeader: { gap: 8 },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sectionTitle: { fontWeight: '600', marginTop: 4 },
  menuAnchor: { position: 'absolute', right: 8, zIndex: 20 },
  hiddenMenuAnchor: { width: 40, height: 40, opacity: 0 },
});
