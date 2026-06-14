import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ActivityIndicator, Button, ProgressBar, Text } from 'react-native-paper';
import { BudgetCategoryRow } from '@/components/BudgetCategoryRow';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import { useApp } from '@/lib/context/AppContext';
import {
  copyBudgetsFromMonth,
  getBudgetVsActual,
  getParentCategories,
  type BudgetVsActual,
} from '@/lib/db/queries';
import { formatCurrency } from '@/lib/format';
import { BORDER_RADIUS, CARD_GAP, CARD_PADDING, layoutStyles } from '@/lib/layout';
import {
  formatBudgetMonth,
  getCalendarMonthRange,
  getCurrentCalendarMonth,
  getDaysLeftInMonth,
  shiftCalendarMonth,
} from '@/lib/periods';
import { useAppTheme } from '@/lib/useAppTheme';

export default function BudgetOverviewScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { ready, refresh, refreshKey } = useApp();
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyleNoFab } = useCollapsibleHeader();
  const current = getCurrentCalendarMonth();
  const [year, setYear] = useState(current.year);
  const [month, setMonth] = useState(current.month);
  const [summary, setSummary] = useState<BudgetVsActual | null>(null);
  const [hasCategories, setHasCategories] = useState(true);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);

  const monthLabel = formatBudgetMonth(year, month);
  const monthRange = useMemo(() => getCalendarMonthRange(year, month), [year, month]);
  const daysLeft = getDaysLeftInMonth(year, month);
  const remaining = (summary?.totalPlanned ?? 0) - (summary?.totalSpent ?? 0);
  const pacePerDay = daysLeft > 0 ? remaining / daysLeft : 0;
  const overBudget =
    (summary?.totalSpent ?? 0) > (summary?.totalPlanned ?? 0) && (summary?.totalPlanned ?? 0) > 0;
  const progress =
    summary && summary.totalPlanned > 0
      ? Math.min(1, summary.totalSpent / summary.totalPlanned)
      : 0;

  const load = useCallback(async () => {
    setLoading(true);
    const [data, parents] = await Promise.all([
      getBudgetVsActual(year, month, monthRange.start, monthRange.end),
      getParentCategories('expense'),
    ]);
    setSummary(data);
    setHasCategories(parents.length > 0);
    setLoading(false);
  }, [month, monthRange.end, monthRange.start, refreshKey, year]);

  useFocusEffect(
    useCallback(() => {
      if (ready) load();
    }, [ready, load]),
  );

  const shiftMonth = (delta: number) => {
    const next = shiftCalendarMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  };

  const openEditor = (focusCategoryId?: string) => {
    router.push({
      pathname: '/budgets/edit',
      params: {
        year: String(year),
        month: String(month),
        ...(focusCategoryId ? { categoryId: focusCategoryId } : {}),
      },
    });
  };

  const handleCopyLastMonth = async () => {
    setCopying(true);
    const prev = shiftCalendarMonth(year, month, -1);
    const copied = await copyBudgetsFromMonth(prev.year, prev.month, year, month);
    setCopying(false);
    if (copied > 0) {
      refresh();
      await load();
    }
  };

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
        title="Budget"
        scrollY={scrollY}
        headerHeight={headerHeight}
        leftAction="back"
        onLeftPress={() => router.back()}
      />
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={scrollContentStyleNoFab}
      >
        <View style={styles.monthNav}>
          <Pressable onPress={() => shiftMonth(-1)} hitSlop={12} style={styles.monthButton}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={28}
              color={theme.colors.onSurface}
            />
          </Pressable>
          <Text variant="titleMedium" style={styles.monthLabel}>
            {monthLabel}
          </Text>
          <Pressable onPress={() => shiftMonth(1)} hitSlop={12} style={styles.monthButton}>
            <MaterialCommunityIcons
              name="chevron-right"
              size={28}
              color={theme.colors.onSurface}
            />
          </Pressable>
        </View>

        {!hasCategories ? (
          <EmptyState
            title="No expense categories"
            message="Create expense categories before setting monthly budgets."
          />
        ) : null}

        {summary && summary.items.length > 0 ? (
          <View
            style={[
              styles.hero,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
            ]}
          >
            <Text variant="headlineSmall" style={styles.heroAmount}>
              {formatCurrency(summary.totalSpent)}
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                {' '}
                / {formatCurrency(summary.totalPlanned)}
              </Text>
            </Text>
            <Text
              variant="bodyMedium"
              style={{
                color: overBudget ? theme.colors.expense : theme.colors.income,
                fontWeight: '600',
              }}
            >
              {overBudget
                ? `${formatCurrency(Math.abs(remaining))} over budget`
                : `${formatCurrency(remaining)} remaining`}
            </Text>
            <ProgressBar
              progress={progress}
              color={overBudget ? theme.colors.expense : theme.colors.income}
              style={styles.heroBar}
            />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {daysLeft > 0
                ? `${formatCurrency(pacePerDay)}/day to stay on track · ${daysLeft} days left`
                : 'Month complete'}
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.hero,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
            ]}
          >
            <Text variant="titleMedium" style={{ fontWeight: '600' }}>
              No budgets for {monthLabel}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Set planned amounts or copy from last month.
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <Button mode="contained" icon="pencil" onPress={() => openEditor()}>
            Edit all
          </Button>
          <Button
            mode="outlined"
            icon="content-copy"
            loading={copying}
            onPress={handleCopyLastMonth}
          >
            Copy last month
          </Button>
        </View>

        {summary && summary.items.length > 0 ? (
          <View style={styles.list}>
            {summary.items.map((item) => (
              <BudgetCategoryRow
                key={item.categoryId}
                item={item}
                highlighted={categoryId === item.categoryId}
                onPress={() => openEditor(item.categoryId)}
              />
            ))}
          </View>
        ) : hasCategories ? (
          <Button mode="contained-tonal" onPress={() => openEditor()} style={styles.setupButton}>
            Set up budgets
          </Button>
        ) : (
          <Button mode="contained-tonal" onPress={() => router.push('/categories')} style={styles.setupButton}>
            Manage categories
          </Button>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontWeight: '700',
  },
  hero: {
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    marginBottom: 12,
  },
  heroAmount: {
    fontWeight: '700',
  },
  heroBar: {
    height: 8,
    borderRadius: BORDER_RADIUS,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    marginBottom: CARD_PADDING,
  },
  list: {
    gap: CARD_GAP,
    paddingBottom: CARD_PADDING,
  },
  setupButton: {
    alignSelf: 'flex-start',
  },
});
