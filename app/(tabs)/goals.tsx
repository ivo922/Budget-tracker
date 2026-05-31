import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button } from 'react-native-paper';
import { AddGoalFab } from '@/components/AddGoalFab';
import { ConfirmPopup } from '@/components/ConfirmPopup';
import { EmptyState } from '@/components/EmptyState';
import { GoalCard } from '@/components/GoalCard';
import { useApp } from '@/lib/context/AppContext';
import { layoutStyles, screenListContentStyle } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';
import { deleteGoal, getGoalsWithProgress } from '@/lib/db/queries';
import type { GoalProgress } from '@/lib/db/queries';

export default function GoalsScreen() {
  const { ready, refresh } = useApp();
  const theme = useAppTheme();
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
      {items.length === 0 ? (
        <View style={screenListContentStyle}>
          <EmptyState
            title="No goals yet"
            message="Create a savings or loan goal and link transactions to track progress."
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.goal.id}
          contentContainerStyle={screenListContentStyle}
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
  cardWrap: { gap: 4 },
});
