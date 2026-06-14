import React, { forwardRef, useMemo } from 'react';
import {
  SectionList,
  StyleSheet,
  View,
  type SectionListProps,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { TransactionDayHeader } from '@/components/TransactionDayHeader';
import { TransactionDayRows } from '@/components/TransactionDayGroup';
import { groupByDay } from '@/lib/groupTransactions';
import { CARD_GAP } from '@/lib/layout';
import type { Account, Category, Transaction } from '@/lib/db/schema';

export type TransactionListItem = {
  tx: Transaction;
  account?: Account;
  category?: Category;
  fromAccount?: Account;
  toAccount?: Account;
  goalName?: string;
  goalId?: string;
  goalContribution?: number;
};

export type TransactionDaySection = {
  key: string;
  monthKey: string;
  title: string;
  total: number;
  data: TransactionListItem[];
};

type SectionPlaceholder = { key: string };

export type TransactionGroupedSection = Omit<TransactionDaySection, 'data'> & {
  transactions: TransactionListItem[];
  data: SectionPlaceholder[];
};

export function buildTransactionDaySections(items: TransactionListItem[]): TransactionDaySection[] {
  const withDate = items.map((item) => ({ ...item, date: item.tx.date }));
  return groupByDay(withDate).map((g) => ({
    key: g.dayKey,
    monthKey: g.monthKey,
    title: g.title,
    total: g.total,
    data: g.data,
  }));
}

function buildGroupedSections(items: TransactionListItem[]): TransactionGroupedSection[] {
  return buildTransactionDaySections(items).map((section) => ({
    key: section.key,
    monthKey: section.monthKey,
    title: section.title,
    total: section.total,
    transactions: section.data,
    data: [{ key: section.key }],
  }));
}

type Props = {
  items: TransactionListItem[];
  onPressItem: (id: string) => void;
  onPressGoal?: (goalId: string) => void;
  showDayTotals?: boolean;
  contentContainerStyle?: ViewStyle;
  stickySectionHeadersEnabled?: boolean;
} & Pick<
  SectionListProps<SectionPlaceholder, TransactionGroupedSection>,
  | 'extraData'
  | 'onScroll'
  | 'scrollEventThrottle'
  | 'onViewableItemsChanged'
  | 'viewabilityConfig'
  | 'onScrollToIndexFailed'
  | 'ListHeaderComponent'
>;

const AnimatedSectionList = Animated.createAnimatedComponent(
  SectionList<SectionPlaceholder, TransactionGroupedSection>,
);

export const TransactionGroupedList = forwardRef<
  SectionList<SectionPlaceholder, TransactionGroupedSection>,
  Props
>(function TransactionGroupedList(
  {
    items,
    onPressItem,
    onPressGoal,
    showDayTotals = true,
    contentContainerStyle,
    stickySectionHeadersEnabled = true,
    ...listProps
  },
  ref,
) {
  const sections = useMemo(() => buildGroupedSections(items), [items]);

  return (
    <AnimatedSectionList
      ref={ref}
      sections={sections}
      keyExtractor={(item) => item.key}
      renderSectionHeader={({ section }) => (
        <TransactionDayHeader
          title={section.title}
          total={showDayTotals ? section.total : undefined}
        />
      )}
      renderItem={({ section }) => (
        <View style={styles.sectionItem}>
          <TransactionDayRows
            section={{
              key: section.key,
              monthKey: section.monthKey,
              title: section.title,
              total: section.total,
              data: section.transactions,
            }}
            onPressItem={onPressItem}
            onPressGoal={onPressGoal}
          />
        </View>
      )}
      stickySectionHeadersEnabled={stickySectionHeadersEnabled}
      contentContainerStyle={contentContainerStyle}
      {...listProps}
    />
  );
});

const styles = StyleSheet.create({
  sectionItem: { marginBottom: CARD_GAP },
});
