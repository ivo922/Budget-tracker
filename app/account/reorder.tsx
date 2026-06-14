import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ActivityIndicator, IconButton, List, Text } from 'react-native-paper';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import { useApp } from '@/lib/context/AppContext';
import { getAccounts, reorderAccounts } from '@/lib/db/queries';
import type { Account } from '@/lib/db/schema';
import { BORDER_RADIUS, layoutStyles, SCREEN_PADDING } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

export default function ReorderAccountsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { ready, refresh } = useApp();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyleNoFab } = useCollapsibleHeader();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setAccounts(await getAccounts());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (ready) load();
    }, [ready, load]),
  );

  const persistOrder = async (next: Account[]) => {
    setAccounts(next);
    setSaving(true);
    await reorderAccounts(next.map((account) => account.id));
    refresh();
    setSaving(false);
  };

  const moveAccount = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= accounts.length) return;
    const next = [...accounts];
    [next[index], next[target]] = [next[target], next[index]];
    void persistOrder(next);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (accounts.length < 2) {
    return (
      <EmptyState
        title="Not enough accounts"
        message="Create at least two accounts to reorder them."
      />
    );
  }

  return (
    <View style={layoutStyles.screen}>
      <CollapsibleScreenHeader
        title="Reorder accounts"
        scrollY={scrollY}
        headerHeight={headerHeight}
        leftAction="back"
        onLeftPress={() => router.back()}
      />
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[scrollContentStyleNoFab, styles.scroll]}
      >
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Dashboard carousel order matches this list.
        </Text>
        <View style={[styles.listCard, { backgroundColor: theme.colors.surface }]}>
          {accounts.map((account, index) => (
            <List.Item
              key={account.id}
              title={account.name}
              left={() => (
                <View style={[styles.colorDot, { backgroundColor: account.color }]} />
              )}
              right={() => (
                <View style={styles.actions}>
                  <IconButton
                    icon="chevron-up"
                    size={20}
                    disabled={index === 0 || saving}
                    onPress={() => moveAccount(index, -1)}
                  />
                  <IconButton
                    icon="chevron-down"
                    size={20}
                    disabled={index === accounts.length - 1 || saving}
                    onPress={() => moveAccount(index, 1)}
                  />
                </View>
              )}
              style={[
                styles.row,
                index < accounts.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.colors.outlineVariant,
                },
              ]}
            />
          ))}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { gap: 12, paddingBottom: SCREEN_PADDING },
  listCard: {
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  row: { paddingRight: 0 },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignSelf: 'center',
    marginLeft: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: -8,
  },
});
