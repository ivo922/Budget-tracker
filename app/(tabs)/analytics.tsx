import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Button, Text } from 'react-native-paper';
import {
  AccountCarousel,
  ADD_ACCOUNT_SLIDE_ID,
  accountFilterForSlide,
  isAddAccountSlide,
  type AccountSlide,
} from '@/components/AccountCarousel';
import { AnalyticsBreadcrumb, type BreadcrumbSegment } from '@/components/AnalyticsBreadcrumb';
import { AnalyticsHeroSummary } from '@/components/AnalyticsHeroSummary';
import { AnalyticsPeriodPicker } from '@/components/AnalyticsPeriodPicker';
import { AnalyticsSkeleton } from '@/components/AnalyticsSkeleton';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { SpendingOverview, type CategoryViewMode } from '@/components/SpendingOverview';
import { SpendingTrendChart } from '@/components/SpendingTrendChart';
import { buildTransactionDaySections } from '@/components/TransactionGroupedList';
import { TransactionDayGroup } from '@/components/TransactionDayGroup';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import { useApp } from '@/lib/context/AppContext';
import {
  getAccountBalance,
  getAccountById,
  getAccounts,
  getBudgetVsActual,
  getCategoryById,
  getDailyTotals,
  getIncomeByCategory,
  getPeriodSummary,
  getSpendingByCategory,
  getSubcategories,
  getTotalNetBalance,
  getTransactions,
  UNCATEGORIZED_CATEGORY_ID,
  type BudgetVsActual,
  type CategorySpending,
} from '@/lib/db/queries';
import type { Account, Category, Transaction } from '@/lib/db/schema';
import {
  formatAnalyticsPeriodSpan,
  getAnalyticsPeriodRange,
  getCalendarMonthRange,
  getCurrentCalendarMonth,
  getPreviousAnalyticsPeriodRange,
  isTrendPeriod,
  type AnalyticsPeriod,
} from '@/lib/periods';
import { layoutStyles } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type EnrichedTx = {
  tx: Transaction;
  account?: Account;
  category?: Category;
};

type DrillState =
  | { level: 'root' }
  | { level: 'subcategories'; parentId: string; parentName: string }
  | {
      level: 'transactions';
      categoryId: string;
      categoryName: string;
      parentId?: string;
      parentName?: string;
    }
  | { level: 'uncategorized' };

export default function AnalyticsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { ready, refreshKey } = useApp();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyleNoFab } = useCollapsibleHeader();

  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const [viewMode, setViewMode] = useState<CategoryViewMode>('expense');
  const [drill, setDrill] = useState<DrillState>({ level: 'root' });
  const [slides, setSlides] = useState<AccountSlide[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0 });
  const [previousExpense, setPreviousExpense] = useState<number | null>(null);
  const [categories, setCategories] = useState<CategorySpending[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetVsActual | null>(null);
  const [trendData, setTrendData] = useState<{ day: string; total: number }[]>([]);
  const [transactions, setTransactions] = useState<EnrichedTx[]>([]);
  const [loading, setLoading] = useState(true);

  const periodRange = useMemo(() => getAnalyticsPeriodRange(period), [period, refreshKey]);
  const previousRange = useMemo(() => getPreviousAnalyticsPeriodRange(period), [period]);
  const showingTransactions = drill.level === 'transactions' || drill.level === 'uncategorized';
  const txSections = useMemo(() => buildTransactionDaySections(transactions), [transactions]);

  const expenseDelta =
    previousExpense != null ? summary.expense - previousExpense : null;
  const expenseDeltaPercent =
    previousExpense != null && previousExpense > 0
      ? Math.round(((summary.expense - previousExpense) / previousExpense) * 100)
      : previousExpense === 0 && summary.expense > 0
        ? 100
        : null;

  const breadcrumbs = useMemo((): BreadcrumbSegment[] => {
    const segments: BreadcrumbSegment[] = [{ id: 'root', label: 'All categories' }];
    if (drill.level === 'subcategories') {
      segments.push({ id: drill.parentId, label: drill.parentName });
    }
    if (drill.level === 'transactions') {
      if (drill.parentId && drill.parentName) {
        segments.push({ id: drill.parentId, label: drill.parentName });
      }
      segments.push({ id: drill.categoryId, label: drill.categoryName });
    }
    if (drill.level === 'uncategorized') {
      segments.push({ id: UNCATEGORIZED_CATEGORY_ID, label: 'Uncategorized' });
    }
    return segments;
  }, [drill]);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await getAccounts();
    const [total, ...balances] = await Promise.all([
      getTotalNetBalance(),
      ...rows.map((a) => getAccountBalance(a.id)),
    ]);
    const accountSlides: AccountSlide[] = rows.map((a, i) => ({
      id: a.id,
      name: a.name,
      color: a.color,
      balance: balances[i],
    }));
    const nextSlides: AccountSlide[] = [
      { id: null, name: 'All accounts', color: theme.colors.primary, balance: total },
      ...accountSlides,
      { id: ADD_ACCOUNT_SLIDE_ID, name: 'Add account', color: theme.colors.primary, balance: 0 },
    ];
    setSlides(nextSlides);

    const safeIndex = selectedIndex < nextSlides.length ? selectedIndex : 0;
    if (safeIndex !== selectedIndex) setSelectedIndex(safeIndex);
    const filter = accountFilterForSlide(nextSlides[safeIndex]);

    const summaryPromise = getPeriodSummary(periodRange.start, periodRange.end, filter);
    const previousPromise = previousRange
      ? getPeriodSummary(previousRange.start, previousRange.end, filter)
      : Promise.resolve(null);

    const categoryParentId =
      drill.level === 'subcategories' ? drill.parentId : undefined;

    const categoryPromise =
      viewMode === 'income'
        ? getIncomeByCategory(periodRange.start, periodRange.end, categoryParentId, filter)
        : getSpendingByCategory(periodRange.start, periodRange.end, categoryParentId, filter);

    const trendPromise =
      isTrendPeriod(period) && viewMode === 'expense' && drill.level === 'root'
        ? getDailyTotals(periodRange.start, periodRange.end, 'expense', filter)
        : Promise.resolve([]);

    const [periodSummary, previousSummary, categoryData, trend] = await Promise.all([
      summaryPromise,
      previousPromise,
      categoryPromise,
      trendPromise,
    ]);

    let txData: EnrichedTx[] = [];
    if (drill.level === 'uncategorized') {
      const txs = await getTransactions({
        type: viewMode === 'income' ? 'income' : 'expense',
        uncategorized: true,
        start: periodRange.start,
        end: periodRange.end,
        accountId: filter,
      });
      txData = await Promise.all(
        txs.map(async (tx) => ({
          tx,
          account: tx.accountId ? await getAccountById(tx.accountId) : undefined,
          category: undefined,
        })),
      );
    } else if (drill.level === 'transactions') {
      const txs = await getTransactions({
        type: viewMode === 'income' ? 'income' : 'expense',
        categoryId: drill.categoryId,
        start: periodRange.start,
        end: periodRange.end,
        accountId: filter,
      });
      txData = await Promise.all(
        txs.map(async (tx) => ({
          tx,
          account: tx.accountId ? await getAccountById(tx.accountId) : undefined,
          category: tx.categoryId ? await getCategoryById(tx.categoryId) : undefined,
        })),
      );
    }

    setSummary(periodSummary);
    setPreviousExpense(previousSummary?.expense ?? null);
    setCategories(categoryData);
    setTrendData(trend);
    setTransactions(txData);

    if (period === 'month' && drill.level === 'root' && viewMode === 'expense') {
      const current = getCurrentCalendarMonth();
      const monthRange = getCalendarMonthRange(current.year, current.month);
      const budget = await getBudgetVsActual(
        current.year,
        current.month,
        monthRange.start,
        monthRange.end,
      );
      setBudgetSummary(budget);
    } else {
      setBudgetSummary(null);
    }

    setLoading(false);
  }, [
    drill,
    period,
    periodRange.end,
    periodRange.start,
    previousRange,
    refreshKey,
    selectedIndex,
    theme.colors.primary,
    viewMode,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (ready) load();
    }, [ready, load]),
  );

  const resetDrill = () => setDrill({ level: 'root' });

  const handleBreadcrumbPress = (index: number) => {
    if (index === 0) {
      resetDrill();
      return;
    }
    if (drill.level === 'transactions' && drill.parentId && index === 1) {
      setDrill({
        level: 'subcategories',
        parentId: drill.parentId,
        parentName: drill.parentName ?? 'Category',
      });
      return;
    }
    resetDrill();
  };

  const handleCategoryPress = async (item: CategorySpending) => {
    if (drill.level === 'subcategories') {
      setDrill({
        level: 'transactions',
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        parentId: drill.parentId,
        parentName: drill.parentName,
      });
      return;
    }

    if (item.categoryId === UNCATEGORIZED_CATEGORY_ID) {
      setDrill({ level: 'uncategorized' });
      return;
    }

    const subs = await getSubcategories(item.categoryId);
    if (subs.length > 0) {
      setDrill({
        level: 'subcategories',
        parentId: item.categoryId,
        parentName: item.categoryName,
      });
      return;
    }

    setDrill({
      level: 'transactions',
      categoryId: item.categoryId,
      categoryName: item.categoryName,
    });
  };

  const sectionTitle = showingTransactions
    ? drill.level === 'uncategorized'
      ? 'Uncategorized transactions'
      : `${drill.categoryName} transactions`
    : drill.level === 'subcategories'
      ? `${drill.parentName} breakdown`
      : viewMode === 'income'
        ? 'Income by category'
        : 'Spending by category';

  if (!ready) {
    return <View style={styles.center} />;
  }

  return (
    <View style={layoutStyles.screen}>
      <CollapsibleScreenHeader title="Analytics" scrollY={scrollY} headerHeight={headerHeight} />
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={scrollContentStyleNoFab}
        nestedScrollEnabled
      >
        <AccountCarousel
          slides={slides}
          selectedIndex={selectedIndex}
          onIndexChange={(index) => {
            setSelectedIndex(index);
            resetDrill();
          }}
          onSlidePress={(slide) => {
            if (isAddAccountSlide(slide)) {
              router.push('/account/add');
              return;
            }
            if (slide.id) router.push(`/account/${slide.id}`);
          }}
        />

        <AnalyticsPeriodPicker
          value={period}
          onChange={(next) => {
            setPeriod(next);
            resetDrill();
          }}
        />

        {loading ? (
          <AnalyticsSkeleton />
        ) : (
          <>
            <AnalyticsHeroSummary
              periodLabel={formatAnalyticsPeriodSpan(periodRange)}
              income={summary.income}
              expense={summary.expense}
              net={summary.net}
              expenseDelta={expenseDelta}
              expenseDeltaPercent={expenseDeltaPercent}
              previousPeriodLabel={previousRange?.label ?? null}
            />

            {isTrendPeriod(period) && viewMode === 'expense' && drill.level === 'root' ? (
              <SpendingTrendChart data={trendData} />
            ) : null}

            <AnalyticsBreadcrumb segments={breadcrumbs} onPress={handleBreadcrumbPress} />

            <Text variant="titleMedium" style={styles.section}>
              {sectionTitle}
            </Text>

            {showingTransactions ? (
              transactions.length === 0 ? (
                <EmptyState
                  title="No transactions"
                  message="Nothing matched this category for the selected period."
                />
              ) : (
                <View style={styles.txList}>
                  {txSections.map((section) => (
                    <TransactionDayGroup
                      key={section.key}
                      section={section}
                      onPressItem={(txId) => router.push(`/transaction/${txId}`)}
                    />
                  ))}
                </View>
              )
            ) : (
              <SpendingOverview
                mode={viewMode}
                onModeChange={(mode) => {
                  setViewMode(mode);
                  resetDrill();
                }}
                data={categories}
                showDonut={drill.level === 'root'}
                budgetItems={budgetSummary?.items}
                onCategoryPress={handleCategoryPress}
                onBudgetPress={(categoryId) =>
                  router.push({ pathname: '/budgets', params: { categoryId } })
                }
              />
            )}

            <Button
              mode="outlined"
              onPress={() => router.push('/categories')}
              style={styles.manage}
            >
              Manage categories
            </Button>
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1 },
  section: { marginTop: 8, marginBottom: 8, fontWeight: '600' },
  manage: { marginTop: 24 },
  txList: { gap: 0 },
});
