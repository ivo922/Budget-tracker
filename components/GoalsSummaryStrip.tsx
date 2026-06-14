import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { GoalCard } from '@/components/GoalCard';
import type { GoalProgress } from '@/lib/db/queries';
import { SCREEN_PADDING } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type GoalListItem = GoalProgress & {
  linkedAccountName?: string;
  linkedAccountBalance?: number;
  paceLabel?: string;
  dueLabel?: string;
};

type Props = {
  items: GoalListItem[];
};

export function GoalsSummaryStrip({ items }: Props) {
  const router = useRouter();
  const theme = useAppTheme();

  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={{ fontWeight: '600' }}>
          Goals
        </Text>
        <Pressable onPress={() => router.push('/(tabs)/goals')}>
          <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
            View all
          </Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {items.map((item) => (
          <View key={item.goal.id} style={styles.cardWrap}>
            <GoalCard
              item={item}
              linkedAccountName={item.linkedAccountName}
              linkedAccountBalance={item.linkedAccountBalance}
              paceLabel={item.paceLabel}
              dueLabel={item.dueLabel}
              compact
              onPress={() => router.push(`/goal/${item.goal.id}`)}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  scroll: {
    gap: 12,
    paddingRight: SCREEN_PADDING,
  },
  cardWrap: { width: 260 },
});
