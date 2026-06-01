import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type SectionList, type SectionListData, type ViewToken } from 'react-native';
import Animated from 'react-native-reanimated';
import { ActivityIndicator, Chip } from 'react-native-paper';
import { AddTransactionFab } from '@/components/AddTransactionFab';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { MonthNavBar } from '@/components/MonthNavBar';
import { ThemedMenu, ThemedMenuItem } from '@/components/ThemedMenu';
import {
  buildTransactionDaySections,
  TransactionGroupedList,
  type TransactionDaySection,
  type TransactionListItem,
} from '@/components/TransactionGroupedList';
import { TransactionTypeChip } from '@/components/TransactionTypeChip';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import { useApp } from '@/lib/context/AppContext';
import { leadingSectionIndexForMonth } from '@/lib/groupTransactions';
import {
  getAccountById,
  getAccounts,
  getCategoryById,
  getTransactions,
} from '@/lib/db/queries';
import type { Account } from '@/lib/db/schema';
import { layoutStyles, SCREEN_PADDING } from '@/lib/layout';

function FiltersHeader({
  filterAccount,
  filterType,
  accounts,
  menuVisible,
  setMenuVisible,
  setFilterAccount,
  setFilterType,
}: {
  filterAccount?: string;
  filterType?: 'income' | 'expense' | 'transfer';
  accounts: Account[];
  menuVisible: boolean;
  setMenuVisible: (v: boolean) => void;
  setFilterAccount: (id: string | undefined) => void;
  setFilterType: (t: 'income' | 'expense' | 'transfer' | undefined) => void;
}) {
  return (
    <View style={styles.filters}>
      <ThemedMenu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Chip icon="filter" onPress={() => setMenuVisible(true)} showSelectedCheck={false}>
            {filterAccount
              ? accounts.find((a) => a.id === filterAccount)?.name ?? 'Account'
              : 'All accounts'}
          </Chip>
        }
      >
        <ThemedMenuItem
          onPress={() => {
            setFilterAccount(undefined);
            setMenuVisible(false);
          }}
          title="All accounts"
        />
        {accounts.map((a) => (
          <ThemedMenuItem
            key={a.id}
            onPress={() => {
              setFilterAccount(a.id);
              setMenuVisible(false);
            }}
            title={a.name}
          />
        ))}
      </ThemedMenu>
      {(['income', 'expense', 'transfer'] as const).map((t) => (
        <TransactionTypeChip
          key={t}
          type={t}
          selected={filterType === t}
          onPress={() => setFilterType(filterType === t ? undefined : t)}
        />
      ))}
    </View>
  );
}

export default function AllTransactionsScreen() {
  const router = useRouter();
  const { ready, refreshKey } = useApp();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyle } = useCollapsibleHeader();
  const listRef = useRef<SectionList<TransactionListItem, TransactionDaySection>>(null);
  const pendingScroll = useRef<{
    sectionIndex: number;
    itemIndex: number;
    viewOffset: number;
  } | null>(null);
  const [monthBarHeight, setMonthBarHeight] = useState(0);
  const [items, setItems] = useState<TransactionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAccount, setFilterAccount] = useState<string | undefined>();
  const [filterType, setFilterType] = useState<'income' | 'expense' | 'transfer' | undefined>();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const [monthBarVisible, setMonthBarVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const txs = await getTransactions({
      accountId: filterAccount,
      type: filterType,
    });
    const enriched = await Promise.all(
      txs.map(async (tx) => ({
        tx,
        account: tx.accountId ? await getAccountById(tx.accountId) : undefined,
        category: tx.categoryId ? await getCategoryById(tx.categoryId) : undefined,
        fromAccount: tx.fromAccountId ? await getAccountById(tx.fromAccountId) : undefined,
        toAccount: tx.toAccountId ? await getAccountById(tx.toAccountId) : undefined,
      })),
    );
    setItems(enriched);
    const sections = buildTransactionDaySections(enriched);
    setActiveMonth(sections[0]?.monthKey ?? null);
    setMonthBarVisible(false);
    setLoading(false);
  }, [filterAccount, filterType, refreshKey]);

  const daySections = useMemo(() => buildTransactionDaySections(items), [items]);

  const monthKeys = useMemo(() => {
    const keys = new Set(daySections.map((s) => s.monthKey));
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [daySections]);

  const showMonthBar = monthKeys.length > 1 && monthBarVisible;

  const scrollToMonth = useCallback(
    (monthKey: string) => {
      const sectionIndex = leadingSectionIndexForMonth(daySections, monthKey);
      if (sectionIndex < 0) return;

      const firstMonthKey = daySections[0]?.monthKey;
      const willShowMonthBar = monthKeys.length > 1 && monthKey !== firstMonthKey;
      if (willShowMonthBar) setMonthBarVisible(true);

      setActiveMonth(monthKey);

      const viewOffset = headerHeight + (willShowMonthBar ? monthBarHeight : 0);

      const target = { sectionIndex, itemIndex: 0, viewOffset };
      pendingScroll.current = target;

      const runScroll = (animated: boolean) => {
        listRef.current?.scrollToLocation({
          ...target,
          animated,
          viewPosition: 0,
        });
      };

      // Unanimated pass helps SectionList measure distant sections; animated pass follows.
      requestAnimationFrame(() => {
        runScroll(false);
        requestAnimationFrame(() => runScroll(true));
      });
    },
    [daySections, monthKeys, headerHeight, monthBarHeight],
  );

  const sectionsRef = useRef(daySections);
  sectionsRef.current = daySections;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<TransactionListItem>[] }) => {
      if (viewableItems.length === 0) return;
      const top = viewableItems.find((v) => v.isViewable) ?? viewableItems[0];
      const section = top.section as SectionListData<TransactionListItem, TransactionDaySection> | undefined;
      if (!section?.monthKey) return;

      setActiveMonth(section.monthKey);

      const firstMonth = sectionsRef.current[0]?.monthKey;
      if (!firstMonth) return;
      setMonthBarVisible(section.monthKey !== firstMonth);
    },
    [],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 40 }).current;

  const listHeader = useMemo(
    () => (
      <FiltersHeader
        filterAccount={filterAccount}
        filterType={filterType}
        accounts={accounts}
        menuVisible={menuVisible}
        setMenuVisible={setMenuVisible}
        setFilterAccount={setFilterAccount}
        setFilterType={setFilterType}
      />
    ),
    [filterAccount, filterType, accounts, menuVisible],
  );

  useFocusEffect(
    useCallback(() => {
      if (ready) {
        getAccounts().then(setAccounts);
        load();
      }
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
        title="Transactions"
        scrollY={scrollY}
        headerHeight={headerHeight}
        leftAction="back"
        onLeftPress={() => router.back()}
      />

      {showMonthBar && activeMonth ? (
        <View
          style={[styles.monthBar, { top: headerHeight }]}
          onLayout={(event) => {
            setMonthBarHeight(event.nativeEvent.layout.height);
          }}
        >
          <MonthNavBar months={monthKeys} activeMonth={activeMonth} onSelectMonth={scrollToMonth} />
        </View>
      ) : null}

      {items.length === 0 ? (
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={[scrollContentStyle, styles.emptyScroll]}
        >
          {listHeader}
          <EmptyState title="No transactions" message="Tap + to add income, expenses, or transfers." />
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
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScrollToIndexFailed={() => {
            const target = pendingScroll.current;
            if (!target) return;
            setTimeout(() => {
              listRef.current?.scrollToLocation({
                sectionIndex: target.sectionIndex,
                itemIndex: target.itemIndex,
                viewOffset: target.viewOffset,
                viewPosition: 0,
                animated: true,
              });
            }, 150);
          }}
        />
      )}

      <AddTransactionFab />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  monthBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: SCREEN_PADDING,
  },
  emptyScroll: { flexGrow: 1 },
});
