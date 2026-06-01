import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type SectionList, type SectionListData, type ViewToken } from 'react-native';
import { ActivityIndicator, Chip } from 'react-native-paper';
import { AddTransactionFab } from '@/components/AddTransactionFab';
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
import { useApp } from '@/lib/context/AppContext';
import {
  getAccountById,
  getAccounts,
  getCategoryById,
  getTransactions,
} from '@/lib/db/queries';
import type { Account } from '@/lib/db/schema';
import { layoutStyles, screenListContentStyle, SCREEN_PADDING } from '@/lib/layout';

export default function AllTransactionsScreen() {
  const router = useRouter();
  const { ready, refreshKey } = useApp();
  const listRef = useRef<SectionList<TransactionListItem, TransactionDaySection>>(null);
  const pendingScroll = useRef<{ sectionIndex: number; itemIndex: number } | null>(null);
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

  const sectionIndexByMonth = useMemo(() => {
    const map = new Map<string, number>();
    daySections.forEach((section, index) => {
      if (!map.has(section.monthKey)) map.set(section.monthKey, index);
    });
    return map;
  }, [daySections]);

  const showMonthBar = monthKeys.length > 1 && monthBarVisible;

  const scrollToMonth = useCallback(
    (monthKey: string) => {
      const sectionIndex = sectionIndexByMonth.get(monthKey);
      if (sectionIndex === undefined) return;
      setActiveMonth(monthKey);
      pendingScroll.current = { sectionIndex, itemIndex: 0 };
      listRef.current?.scrollToLocation({
        sectionIndex,
        itemIndex: 0,
        animated: true,
        viewOffset: 0,
      });
    },
    [sectionIndexByMonth],
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
      <View style={layoutStyles.filtersRow}>
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

      {showMonthBar && activeMonth ? (
        <MonthNavBar months={monthKeys} activeMonth={activeMonth} onSelectMonth={scrollToMonth} />
      ) : null}

      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState title="No transactions" message="Tap + to add income, expenses, or transfers." />
        </View>
      ) : (
        <TransactionGroupedList
          ref={listRef}
          items={items}
          extraData={items}
          contentContainerStyle={screenListContentStyle}
          onPressItem={(id) => router.push(`/transaction/${id}`)}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScrollToIndexFailed={() => {
            const target = pendingScroll.current;
            if (!target) return;
            setTimeout(() => {
              listRef.current?.scrollToLocation({
                ...target,
                animated: true,
              });
              pendingScroll.current = null;
            }, 100);
          }}
        />
      )}

      <AddTransactionFab />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, padding: SCREEN_PADDING },
});
