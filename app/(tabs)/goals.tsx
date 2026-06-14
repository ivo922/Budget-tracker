import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ActivityIndicator, Button } from 'react-native-paper';
import { AddGoalFab } from '@/components/AddGoalFab';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { GoalCard } from '@/components/GoalCard';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import { useApp } from '@/lib/context/AppContext';
import { layoutStyles } from '@/lib/layout';
import { navigateToConfirm } from '@/lib/navigateConfirm';
import { useAppTheme } from '@/lib/useAppTheme';
import { getAccountBalance, getAccountById, getGoalsWithProgress } from '@/lib/db/queries';
import type { GoalProgress } from '@/lib/db/queries';

type GoalListItem = GoalProgress & {
  linkedAccountName?: string;
  linkedAccountBalance?: number;
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<GoalListItem>);

export default function GoalsScreen() {
  const router = useRouter();
  const { ready } = useApp();
  const theme = useAppTheme();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyle } = useCollapsibleHeader();
  const [items, setItems] = useState<GoalListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const goals = await getGoalsWithProgress();
    const enriched = await Promise.all(
      goals.map(async (item) => {
        if (!item.goal.accountId || item.goal.type !== 'savings') return item;
        const account = await getAccountById(item.goal.accountId);
        if (!account) return item;
        return {
          ...item,
          linkedAccountName: account.name,
          linkedAccountBalance: await getAccountBalance(account.id),
        };
      }),
    );
    setItems(enriched);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (ready) load();
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
      <CollapsibleScreenHeader title="Goals" scrollY={scrollY} headerHeight={headerHeight} />
      {items.length === 0 ? (
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={[scrollContentStyle, styles.emptyScroll]}
        >
          <EmptyState
            title="No goals yet"
            message="Create a savings or loan goal and link transactions to track progress."
          />
        </Animated.ScrollView>
      ) : (
        <AnimatedFlatList
          data={items}
          keyExtractor={(item) => item.goal.id}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={scrollContentStyle}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <GoalCard
                item={item}
                linkedAccountName={item.linkedAccountName}
                linkedAccountBalance={item.linkedAccountBalance}
                onPress={() => router.push(`/goal/${item.goal.id}`)}
              />
              {item.goal.status === 'active' ? (
                <Button
                  mode="text"
                  textColor={theme.colors.error}
                  onPress={() =>
                    navigateToConfirm(router, {
                      type: 'goal',
                      id: item.goal.id,
                      title: 'Delete goal?',
                      message: 'Linked transactions will be unlinked. This cannot be undone.',
                    })
                  }
                >
                  Delete
                </Button>
              ) : null}
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
  cardWrap: { gap: 4 },
});
