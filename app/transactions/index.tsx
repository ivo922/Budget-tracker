import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type SectionList, type SectionListData, type ViewToken } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator } from 'react-native-paper';
import { AddTransactionFab } from '@/components/AddTransactionFab';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { MONTH_NAV_BAR_FALLBACK_HEIGHT, MonthNavBar } from '@/components/MonthNavBar';
import {
  buildTransactionDaySections,
  TransactionGroupedList,
  type TransactionGroupedSection,
  type TransactionListItem,
} from '@/components/TransactionGroupedList';
import {
  countActiveTransactionFilters,
  EMPTY_TRANSACTION_FILTERS,
  TransactionFiltersPanel,
  transactionFiltersToQuery,
  type TransactionFiltersValue,
} from '@/components/TransactionFiltersPanel';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import { useApp } from '@/lib/context/AppContext';
import { leadingSectionIndexForMonth } from '@/lib/groupTransactions';
import {
  estimateScrollOffsetToSection,
  MONTH_SCROLL_EXTRA_OFFSET,
  scrollListToOffset,
  type ScrollableList,
} from '@/lib/transactionListScroll';
import {
  getAccountById,
  getAccounts,
  getCategoryById,
  getGoals,
  getTransactions,
} from '@/lib/db/queries';
import type { Account } from '@/lib/db/schema';
import { layoutStyles, SCREEN_PADDING } from '@/lib/layout';

export default function AllTransactionsScreen() {
  const router = useRouter();
  const { accountId: routeAccountId, categoryId: routeCategoryId } = useLocalSearchParams<{
    accountId?: string;
    categoryId?: string;
  }>();
  const insets = useSafeAreaInsets();
  const { ready, refreshKey } = useApp();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyle } = useCollapsibleHeader();
  const listRef = useRef<SectionList<{ key: string }, TransactionGroupedSection>>(null);
  const suppressViewabilityRef = useRef(false);
  const [islandHeight, setIslandHeight] = useState(MONTH_NAV_BAR_FALLBACK_HEIGHT);
  const [listHeaderHeight, setListHeaderHeight] = useState(0);
  const [items, setItems] = useState<TransactionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TransactionFiltersValue>(EMPTY_TRANSACTION_FILTERS);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeMonth, setActiveMonth] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [txs, goalRows] = await Promise.all([
      getTransactions(transactionFiltersToQuery(filters)),
      getGoals(),
    ]);
    const goalMap = new Map(goalRows.map((g) => [g.id, g.name]));
    const enriched = await Promise.all(
      txs.map(async (tx) => ({
        tx,
        account: tx.accountId ? await getAccountById(tx.accountId) : undefined,
        category: tx.categoryId ? await getCategoryById(tx.categoryId) : undefined,
        fromAccount: tx.fromAccountId ? await getAccountById(tx.fromAccountId) : undefined,
        toAccount: tx.toAccountId ? await getAccountById(tx.toAccountId) : undefined,
        goalName: tx.goalId ? goalMap.get(tx.goalId) : undefined,
        goalId: tx.goalId ?? undefined,
      })),
    );
    setItems(enriched);
    const sections = buildTransactionDaySections(enriched);
    setActiveMonth(sections[0]?.monthKey ?? null);
    setLoading(false);
  }, [filters, refreshKey]);

  const daySections = useMemo(() => buildTransactionDaySections(items), [items]);

  const monthKeys = useMemo(() => {
    const keys = new Set(daySections.map((s) => s.monthKey));
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [daySections]);

  const showMonthIsland = monthKeys.length > 1 && activeMonth != null;

  const islandStickTop = insets.top + SCREEN_PADDING;
  const islandRestTop = headerHeight + SCREEN_PADDING;

  const islandAnimatedStyle = useAnimatedStyle(() => ({
    top: Math.max(islandStickTop, islandRestTop - scrollY.value),
  }));

  const islandSpacerHeight = SCREEN_PADDING + islandHeight + SCREEN_PADDING;

  const scrollToMonth = useCallback(
    (monthKey: string) => {
      const sectionIndex = leadingSectionIndexForMonth(daySections, monthKey);
      if (sectionIndex < 0 || !listRef.current) return;

      suppressViewabilityRef.current = true;
      setActiveMonth(monthKey);

      const offset = estimateScrollOffsetToSection(
        daySections,
        sectionIndex,
        headerHeight,
        listHeaderHeight,
      );

      const islandClearance = showMonthIsland
        ? islandStickTop + islandHeight + SCREEN_PADDING
        : 0;

      scrollListToOffset(
        listRef.current as ScrollableList,
        offset - islandClearance - MONTH_SCROLL_EXTRA_OFFSET,
        true,
      );

      setTimeout(() => {
        suppressViewabilityRef.current = false;
      }, 400);
    },
    [daySections, headerHeight, islandHeight, islandStickTop, listHeaderHeight, showMonthIsland],
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<{ key: string }>[] }) => {
      if (suppressViewabilityRef.current || viewableItems.length === 0) return;
      const top = viewableItems.find((v) => v.isViewable) ?? viewableItems[0];
      const section = top.section as SectionListData<{ key: string }, TransactionGroupedSection> | undefined;
      if (!section?.monthKey) return;

      setActiveMonth(section.monthKey);
    },
    [],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 40 }).current;

  const listHeader = useMemo(
    () => (
      <View
        onLayout={(event) => {
          setListHeaderHeight(event.nativeEvent.layout.height);
        }}
      >
        {showMonthIsland ? <View style={{ height: islandSpacerHeight }} /> : null}
        <View style={styles.filtersWrap}>
          <TransactionFiltersPanel value={filters} onChange={setFilters} accounts={accounts} />
        </View>
      </View>
    ),
    [accounts, filters, showMonthIsland, islandSpacerHeight],
  );

  useEffect(() => {
    if (routeAccountId) {
      setFilters((prev) => ({ ...prev, accountId: routeAccountId }));
    }
  }, [routeAccountId]);

  useEffect(() => {
    if (!routeCategoryId) return;
    getCategoryById(routeCategoryId).then((category) => {
      if (!category) return;
      setFilters((prev) => ({
        ...prev,
        category,
        uncategorized: false,
        type:
          category.type === 'income' || category.type === 'expense' ? category.type : prev.type,
      }));
    });
  }, [routeCategoryId]);

  useFocusEffect(
    useCallback(() => {
      if (!ready) return;
      getAccounts().then(setAccounts);
    }, [ready]),
  );

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
      <CollapsibleScreenHeader
        title="Transactions"
        scrollY={scrollY}
        headerHeight={headerHeight}
        leftAction={showMonthIsland ? undefined : 'back'}
        onLeftPress={showMonthIsland ? undefined : () => router.back()}
      />

      {showMonthIsland ? (
        <Animated.View
          style={[
            styles.floatingIsland,
            { left: SCREEN_PADDING, right: SCREEN_PADDING },
            islandAnimatedStyle,
          ]}
          onLayout={(event) => {
            setIslandHeight(event.nativeEvent.layout.height);
          }}
        >
          <MonthNavBar
            months={monthKeys}
            activeMonth={activeMonth}
            onSelectMonth={scrollToMonth}
            onBackPress={() => router.back()}
          />
        </Animated.View>
      ) : null}

      {items.length === 0 ? (
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={[scrollContentStyle, styles.emptyScroll]}
        >
          {listHeader}
          <EmptyState
            title="No transactions"
            message={
              countActiveTransactionFilters(filters) > 0
                ? 'No transactions match your filters.'
                : 'Tap + to add income, expenses, or transfers.'
            }
          />
        </Animated.ScrollView>
      ) : (
        <TransactionGroupedList
          ref={listRef}
          items={items}
          extraData={items}
          contentContainerStyle={scrollContentStyle}
          ListHeaderComponent={listHeader}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onPressItem={(id) => router.push(`/transaction/${id}`)}
          onPressGoal={(goalId) => router.push(`/goal/${goalId}`)}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      )}

      <AddTransactionFab />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  floatingIsland: {
    position: 'absolute',
    zIndex: 10,
  },
  filtersWrap: {
    paddingBottom: SCREEN_PADDING,
  },
  emptyScroll: { flexGrow: 1 },
});
