import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ActivityIndicator, IconButton, List, Text } from 'react-native-paper';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import {
  ALL_ACCOUNTS_SLIDE_ID,
  normalizeCarouselOrder,
} from '@/lib/accountCarousel';
import { useApp } from '@/lib/context/AppContext';
import { getAccountCarouselOrder, getAccounts, reorderAccountCarousel } from '@/lib/db/queries';
import { BORDER_RADIUS, layoutStyles, SCREEN_PADDING } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type ReorderRow = {
  id: string;
  name: string;
  color: string;
};

export default function ReorderAccountsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { ready, refresh } = useApp();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyleNoFab } = useCollapsibleHeader();
  const [rows, setRows] = useState<ReorderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [accounts, order] = await Promise.all([getAccounts(), getAccountCarouselOrder()]);
    const tokens = normalizeCarouselOrder(order, accounts);
    const accountById = new Map(accounts.map((account) => [account.id, account]));
    setRows(
      tokens.map((token) => {
        if (token === ALL_ACCOUNTS_SLIDE_ID) {
          return {
            id: ALL_ACCOUNTS_SLIDE_ID,
            name: 'All accounts',
            color: theme.colors.primary,
          };
        }
        const account = accountById.get(token)!;
        return { id: account.id, name: account.name, color: account.color };
      }),
    );
    setLoading(false);
  }, [theme.colors.primary]);

  useFocusEffect(
    useCallback(() => {
      if (ready) load();
    }, [ready, load]),
  );

  const persistOrder = async (next: ReorderRow[]) => {
    setRows(next);
    setSaving(true);
    await reorderAccountCarousel(next.map((row) => row.id));
    refresh();
    setSaving(false);
  };

  const moveRow = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
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

  if (rows.length < 2) {
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
          {rows.map((row, index) => (
            <List.Item
              key={row.id}
              title={row.name}
              left={() => (
                <View style={[styles.colorDot, { backgroundColor: row.color }]} />
              )}
              right={() => (
                <View style={styles.actions}>
                  <IconButton
                    icon="chevron-up"
                    size={20}
                    disabled={index === 0 || saving}
                    onPress={() => moveRow(index, -1)}
                  />
                  <IconButton
                    icon="chevron-down"
                    size={20}
                    disabled={index === rows.length - 1 || saving}
                    onPress={() => moveRow(index, 1)}
                  />
                </View>
              )}
              style={[
                styles.row,
                index < rows.length - 1 && {
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
