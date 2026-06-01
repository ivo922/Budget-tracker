import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ActivityIndicator, Button } from 'react-native-paper';
import { AddGoalFab } from '@/components/AddGoalFab';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { ConfirmPopup } from '@/components/ConfirmPopup';
import { EmptyState } from '@/components/EmptyState';
import { GoalCard } from '@/components/GoalCard';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import { useApp } from '@/lib/context/AppContext';
import { layoutStyles } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';
import { deleteGoal, getGoalsWithProgress } from '@/lib/db/queries';
import type { GoalProgress } from '@/lib/db/queries';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<GoalProgress>);

export default function GoalsScreen() {
  const { ready, refresh } = useApp();
  const theme = useAppTheme();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyle } = useCollapsibleHeader();
  const [items, setItems] = useState<GoalProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<GoalProgress | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await getGoalsWithProgress());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (ready) load();
    }, [ready, load]),
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteGoal(deleteTarget.goal.id);
    setDeleteTarget(null);
    refresh();
    load();
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
              <GoalCard item={item} />
              {item.goal.status === 'active' ? (
                <Button mode="text" textColor={theme.colors.error} onPress={() => setDeleteTarget(item)}>
                  Delete
                </Button>
              ) : null}
            </View>
          )}
        />
      )}

      <AddGoalFab onSaved={load} />

      <ConfirmPopup
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete goal?"
        message="Linked transactions will be unlinked. This cannot be undone."
        onConfirm={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyScroll: { flexGrow: 1 },
  cardWrap: { gap: 4 },
});
