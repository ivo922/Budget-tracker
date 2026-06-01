import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { BalanceCard } from '@/components/BalanceCard';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { PeriodSelector } from '@/components/PeriodSelector';
import { SpendingChart } from '@/components/SpendingChart';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import { useApp } from '@/lib/context/AppContext';
import {
  getPeriodSummary,
  getSpendingByCategory,
  type CategorySpending,
} from '@/lib/db/queries';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { ready, period, periodRange, setPeriod, refreshKey } = useApp();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyleNoFab } = useCollapsibleHeader();
  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0 });
  const [spending, setSpending] = useState<CategorySpending[]>([]);
  const [drillParent, setDrillParent] = useState<string | null>(null);
  const [drillName, setDrillName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const s = await getPeriodSummary(periodRange.start, periodRange.end);
    setSummary(s);
    const data = await getSpendingByCategory(
      periodRange.start,
      periodRange.end,
      drillParent ?? undefined,
    );
    setSpending(data);
    setLoading(false);
  }, [periodRange.start, periodRange.end, drillParent, refreshKey]);

  useFocusEffect(
    useCallback(() => {
      if (ready) load();
    }, [ready, load]),
  );

  const handleBarPress = (item: CategorySpending) => {
    if (drillParent) return;
    setDrillParent(item.categoryId);
    setDrillName(item.categoryName);
  };

  if (!ready || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CollapsibleScreenHeader
        title="Analytics"
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
        <PeriodSelector value={period} onChange={setPeriod} />
        <View style={styles.cards}>
          <BalanceCard label="Income" amount={summary.income} variant="income" />
          <BalanceCard label="Expenses" amount={summary.expense} variant="expense" />
        </View>

        <Text variant="titleMedium" style={styles.section}>
          {drillName ? `${drillName} breakdown` : 'Spending by category'}
        </Text>
        {drillParent && (
          <Button mode="text" onPress={() => { setDrillParent(null); setDrillName(null); }}>
            ← Back to categories
          </Button>
        )}
        <SpendingChart data={spending} onBarPress={handleBarPress} />

        <Button mode="outlined" onPress={() => router.push('/categories')} style={styles.manage}>
          Manage categories
        </Button>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cards: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  section: { marginTop: 16, marginBottom: 8 },
  manage: { marginTop: 24 },
});
