import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { AccountCarousel, accountFilterForSlide, isAddAccountSlide, isAllAccountsSlide, isRealAccountSlide, type AccountSlide } from '@/components/AccountCarousel';
import { FadeOnFocusView } from '@/components/FadeOnFocusView';
import { ScreenLoading } from '@/components/ScreenLoading';
import { AddTransactionFab } from '@/components/AddTransactionFab';
import { BudgetSummary } from '@/components/BudgetSummary';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { GoalsSummaryStrip } from '@/components/GoalsSummaryStrip';
import { EmptyState } from '@/components/EmptyState';
import { MonthSummaryCard } from '@/components/MonthSummaryCard';
import { buildTransactionDaySections, type TransactionListItem } from '@/components/TransactionGroupedList';
import { TransactionDayGroup } from '@/components/TransactionDayGroup';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import { useApp } from '@/lib/context/AppContext';
import {
  getActiveGoalsWithProgress,
  getBudgetVsActual,
  getGoals,
  getPeriodSummary,
  getTransactions,
  type BudgetVsActual,
} from '@/lib/db/queries';
import { enrichTransactions } from '@/lib/enrichTransactions';
import { enrichGoalListItem, type GoalListItem } from '@/lib/enrichGoals';
import { loadAccountCarouselData } from '@/hooks/useAccountCarouselSlides';
import type { DashboardPeriod } from '@/lib/periods';
import {
  formatBudgetMonth,
  getCalendarMonthRange,
  getCurrentCalendarMonth,
  getDashboardPeriodRange,
} from '@/lib/periods';
import { CARD_GAP, layoutStyles } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type DashboardGoalItem = GoalListItem;

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { ready, refreshKey } = useApp();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyle } = useCollapsibleHeader();
  const [period, setPeriod] = useState<DashboardPeriod>('this_month');
  const [summary, setSummary] = useState({ income: 0, expense: 0 });
  const [recent, setRecent] = useState<TransactionListItem[]>([]);
  const [slides, setSlides] = useState<AccountSlide[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [budgetSummary, setBudgetSummary] = useState<BudgetVsActual | null>(null);
  const [activeGoals, setActiveGoals] = useState<DashboardGoalItem[]>([]);
  const recentSections = useMemo(() => buildTransactionDaySections(recent), [recent]);

  const currentMonth = getCurrentCalendarMonth();
  const budgetMonthRange = useMemo(
    () => getCalendarMonthRange(currentMonth.year, currentMonth.month),
    [refreshKey],
  );
  const budgetMonthLabel = formatBudgetMonth(currentMonth.year, currentMonth.month);

  const openBudgets = () => {
    router.push('/budgets');
  };

  const openBudgetEditor = () => {
    router.push({
      pathname: '/budgets/edit',
      params: {
        year: String(currentMonth.year),
        month: String(currentMonth.month),
      },
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    const carousel = await loadAccountCarouselData({
      primaryColor: theme.colors.primary,
      selectedIndex,
    });
    setSlides(carousel.slides);
    if (carousel.selectedIndex !== selectedIndex) setSelectedIndex(carousel.selectedIndex);
    const accountFilter = carousel.accountFilter;
    const range = getDashboardPeriodRange(period);
    const [periodSummary, txs, budget, goalRows, goalProgressRows] = await Promise.all([
      getPeriodSummary(range.start, range.end, accountFilter),
      getTransactions({ limit: 5, accountId: accountFilter }),
      getBudgetVsActual(
        currentMonth.year,
        currentMonth.month,
        budgetMonthRange.start,
        budgetMonthRange.end,
      ),
      getGoals(),
      getActiveGoalsWithProgress(3),
    ]);
    const goalMap = new Map(goalRows.map((g) => [g.id, g.name]));
    setSummary(periodSummary);
    setBudgetSummary(budget);
    const enrichedGoals = await Promise.all(goalProgressRows.map(enrichGoalListItem));
    setActiveGoals(enrichedGoals);
    const enriched = await enrichTransactions(txs, { goalNames: goalMap });
    setRecent(enriched);
    setLoading(false);
  }, [budgetMonthRange.end, budgetMonthRange.start, currentMonth.month, currentMonth.year, period, refreshKey, selectedIndex, theme.colors.primary]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const hasAccounts = slides.some(isRealAccountSlide);
  const accountCount = slides.filter(isRealAccountSlide).length;
  const selectedSlide = slides[selectedIndex];
  const selectedAccountId = accountFilterForSlide(selectedSlide);

  const openAllTransactions = () => {
    if (selectedAccountId) {
      router.push({
        pathname: '/transactions',
        params: { accountId: selectedAccountId },
      });
      return;
    }
    router.push('/transactions');
  };

  if (!ready || (loading && slides.length === 0)) {
    return (
      <FadeOnFocusView>
        <ScreenLoading />
      </FadeOnFocusView>
    );
  }

  return (
    <FadeOnFocusView>
      <View style={layoutStyles.screen}>
      <CollapsibleScreenHeader title="Dashboard" scrollY={scrollY} headerHeight={headerHeight} />
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={scrollContentStyle}
        nestedScrollEnabled
      >
        <AccountCarousel
          slides={slides}
          selectedIndex={selectedIndex}
          onIndexChange={setSelectedIndex}
          onSlidePress={(slide) => {
            if (isAddAccountSlide(slide)) {
              router.push('/account/add');
              return;
            }
            if (slide.id && !isAllAccountsSlide(slide)) router.push(`/account/${slide.id}`);
          }}
        />

        {accountCount > 1 ? (
          <View style={styles.carouselActions}>
            <Button
              compact
              mode="text"
              icon="swap-vertical"
              onPress={() => router.push('/account/reorder')}
            >
              Reorder accounts
            </Button>
          </View>
        ) : null}

        {!hasAccounts ? (
          <EmptyState
            title="No accounts yet"
            message="Swipe to Add account and create your first one."
          />
        ) : null}

        <MonthSummaryCard
          period={period}
          onPeriodChange={setPeriod}
          income={summary.income}
          expense={summary.expense}
        />

        {period === 'this_month' && budgetSummary ? (
          <BudgetSummary
            summary={budgetSummary}
            monthLabel={budgetMonthLabel}
            onPress={openBudgets}
            onEdit={openBudgetEditor}
            onSetup={openBudgets}
          />
        ) : (
          <View style={styles.budgetHint}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
              Budgets track {budgetMonthLabel}.
            </Text>
            <Button compact mode="text" onPress={openBudgets}>
              View
            </Button>
          </View>
        )}

        <GoalsSummaryStrip items={activeGoals} />

        <View style={styles.recentHeader}>
          <Text variant="titleMedium">Recent transactions</Text>
          <Button compact mode="text" onPress={openAllTransactions}>
            View all
          </Button>
        </View>
        {loading ? (
          <ActivityIndicator style={styles.listLoader} />
        ) : recent.length === 0 ? (
          <EmptyState title="No transactions yet" message="Tap + to add your first transaction." />
        ) : (
          <View style={styles.recentList}>
            {recentSections.map((section) => (
              <TransactionDayGroup
                key={section.key}
                section={section}
                onPressItem={(txId) => router.push(`/transaction/${txId}`)}
                onPressGoal={(goalId) => router.push(`/goal/${goalId}`)}
              />
            ))}
          </View>
        )}
      </Animated.ScrollView>
      <AddTransactionFab />
      </View>
    </FadeOnFocusView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  budgetHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: CARD_GAP,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: CARD_GAP,
  },
  carouselActions: {
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: CARD_GAP,
  },
  recentList: { gap: 0 },
  listLoader: { marginVertical: 24 },
});
