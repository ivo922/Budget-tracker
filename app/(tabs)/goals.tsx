import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ActivityIndicator, Button } from 'react-native-paper';
import { AddGoalFab } from '@/components/AddGoalFab';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { GoalCard } from '@/components/GoalCard';
import { GoalFilterBar, matchesGoalFilter, type GoalListFilter } from '@/components/GoalFilterBar';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import { useApp } from '@/lib/context/AppContext';
import { enrichGoalListItem, type GoalListItem } from '@/lib/enrichGoals';
import { CARD_GAP, layoutStyles } from '@/lib/layout';
import {
  getGoalsWithProgress,
} from '@/lib/db/queries';
import type { GoalType } from '@/lib/db/schema';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<GoalListItem>);

export default function GoalsScreen() {
  const router = useRouter();
  const { ready } = useApp();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyle } = useCollapsibleHeader();
  const [items, setItems] = useState<GoalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<GoalListFilter>('active');
  const [showArchived, setShowArchived] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const goals = await getGoalsWithProgress();
    const enriched = await Promise.all(goals.map(enrichGoalListItem));
    setItems(enriched);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (ready) load();
    }, [ready, load]),
  );

  const archivedCount = useMemo(
    () => items.filter((item) => item.goal.status === 'archived').length,
    [items],
  );

  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => matchesGoalFilter(item.goal, filter, showArchived));
    return filtered.sort((a, b) => {
      if (a.goal.status === 'active' && b.goal.status !== 'active') return -1;
      if (b.goal.status === 'active' && a.goal.status !== 'active') return 1;
      return b.percent - a.percent;
    });
  }, [filter, items, showArchived]);

  const openAdd = (type: GoalType = 'savings') => {
    router.push({ pathname: '/goal/add', params: { type } });
  };

  if (!ready || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const listHeader = (
    <GoalFilterBar
      value={filter}
      onChange={setFilter}
      showArchived={showArchived}
      onToggleArchived={() => setShowArchived((v) => !v)}
      archivedCount={archivedCount}
    />
  );

  return (
    <View style={layoutStyles.screen}>
      <CollapsibleScreenHeader title="Goals" scrollY={scrollY} headerHeight={headerHeight} />
      {items.length === 0 ? (
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={[scrollContentStyle, styles.emptyScroll]}
        >
          <EmptyState
            title="No goals yet"
            message="1. Set a target · 2. Link an account or transactions."
          />
          <View style={styles.emptyActions}>
            <Button mode="contained" onPress={() => openAdd('savings')}>
              Create savings goal
            </Button>
            <Button mode="outlined" onPress={() => openAdd('loan')}>
              Track a loan
            </Button>
          </View>
        </Animated.ScrollView>
      ) : (
        <AnimatedFlatList
          data={visibleItems}
          keyExtractor={(item) => item.goal.id}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={scrollContentStyle}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <EmptyState
              title="No goals in this view"
              message={showArchived ? 'Try another filter.' : 'Completed goals appear under Completed.'}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <GoalCard
                item={item}
                linkedAccountName={item.linkedAccountName}
                linkedAccountBalance={item.linkedAccountBalance}
                paceLabel={item.paceLabel}
                dueLabel={item.dueLabel}
                onPress={() => router.push(`/goal/${item.goal.id}`)}
                onLinkPress={() => router.push(`/goal/link/${item.goal.id}`)}
              />
            </View>
          )}
        />
      )}

      <AddGoalFab />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyScroll: { flexGrow: 1 },
  emptyActions: { gap: 12, paddingHorizontal: 16, marginTop: 8 },
  cardWrap: { marginBottom: CARD_GAP },
});
