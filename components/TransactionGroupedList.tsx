import React, { forwardRef, useMemo } from 'react';
import {
  SectionList,
  StyleSheet,
  View,
  type SectionListProps,
  type SectionListRenderItem,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { Divider } from 'react-native-paper';
import { TransactionDayHeader } from '@/components/TransactionDayHeader';
import { TransactionRow } from '@/components/TransactionRow';
import { groupByDay } from '@/lib/groupTransactions';
import { BORDER_RADIUS } from '@/lib/layout';
import type { Account, Category, Transaction } from '@/lib/db/schema';
import { useAppTheme } from '@/lib/useAppTheme';

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

type Props = {
  items: TransactionListItem[];
  onPressItem: (id: string) => void;
  onPressGoal?: (goalId: string) => void;
  showDayTotals?: boolean;
  contentContainerStyle?: ViewStyle;
  stickySectionHeadersEnabled?: boolean;
} & Pick<
  SectionListProps<TransactionListItem, TransactionDaySection>,
  | 'extraData'
  | 'onScroll'
  | 'scrollEventThrottle'
  | 'onViewableItemsChanged'
  | 'viewabilityConfig'
  | 'onScrollToIndexFailed'
  | 'ListHeaderComponent'
>;

const AnimatedSectionList = Animated.createAnimatedComponent(
  SectionList<TransactionListItem, TransactionDaySection>,
);

export const TransactionGroupedList = forwardRef<
  SectionList<TransactionListItem, TransactionDaySection>,
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
  const theme = useAppTheme();
  const sections = useMemo(() => buildTransactionDaySections(items), [items]);

  const renderItem: SectionListRenderItem<TransactionListItem, TransactionDaySection> = ({
    item,
    index,
    section,
  }) => {
    if (!item?.tx) return null;
    const isFirst = index === 0;
    const isLast = index === section.data.length - 1;

    return (
      <View
        style={[
          styles.dayCard,
          { backgroundColor: theme.colors.surface },
          isFirst && styles.dayCardFirst,
          isLast && styles.dayCardLast,
        ]}
      >
        <TransactionRow
          transaction={item.tx}
          account={item.account}
          category={item.category}
          fromAccount={item.fromAccount}
          toAccount={item.toAccount}
          goalName={item.goalName}
          goalId={item.goalId}
          goalContribution={item.goalContribution}
          onPress={() => onPressItem(item.tx.id)}
          onPressGoal={onPressGoal}
        />
        {!isLast ? <Divider style={{ backgroundColor: theme.colors.outlineVariant }} /> : null}
      </View>
    );
  };

  return (
    <AnimatedSectionList
      ref={ref}
      sections={sections}
      keyExtractor={(item, index) => item?.tx?.id ?? `tx-row-${index}`}
      renderSectionHeader={({ section }) => (
        <TransactionDayHeader
          title={section.title}
          total={showDayTotals ? section.total : undefined}
        />
      )}
      renderItem={renderItem}
      stickySectionHeadersEnabled={stickySectionHeadersEnabled}
      contentContainerStyle={contentContainerStyle}
      {...listProps}
    />
  );
});

const styles = StyleSheet.create({
  dayCard: {
    overflow: 'hidden',
  },
  dayCardFirst: {
    borderTopLeftRadius: BORDER_RADIUS,
    borderTopRightRadius: BORDER_RADIUS,
  },
  dayCardLast: {
    borderBottomLeftRadius: BORDER_RADIUS,
    borderBottomRightRadius: BORDER_RADIUS,
    marginBottom: 12,
  },
});
