import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActivityIndicator, Button, ProgressBar, Text } from 'react-native-paper';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import { useApp } from '@/lib/context/AppContext';
import {
  getAccountBalance,
  getAccountById,
  getActiveGoalByAccountId,
  getGoalProgress,
  getTotalNetBalance,
  type GoalProgress,
} from '@/lib/db/queries';
import type { Account } from '@/lib/db/schema';
import { formatCurrency } from '@/lib/format';
import {
  BORDER_RADIUS,
  CARD_GAP,
  CARD_INNER_GAP,
  CARD_PADDING,
  layoutStyles,
  ROW_BODY_GAP,
  SCREEN_PADDING,
} from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const { ready } = useApp();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyleNoFab } = useCollapsibleHeader();

  const [account, setAccount] = useState<Account | null>(null);
  const [balance, setBalance] = useState(0);
  const [netWorthShare, setNetWorthShare] = useState<number | null>(null);
  const [linkedGoalProgress, setLinkedGoalProgress] = useState<GoalProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const acct = await getAccountById(id);
    if (!acct) {
      setAccount(null);
      setLoading(false);
      return;
    }
    setAccount(acct);
    const [acctBalance, totalNet, linkedGoal] = await Promise.all([
      getAccountBalance(id),
      getTotalNetBalance(),
      getActiveGoalByAccountId(id),
    ]);
    setBalance(acctBalance);
    setNetWorthShare(
      totalNet > 0 && acctBalance >= 0 ? Math.round((acctBalance / totalNet) * 100) : null,
    );
    if (linkedGoal) {
      setLinkedGoalProgress(await getGoalProgress(linkedGoal.id));
    } else {
      setLinkedGoalProgress(null);
    }
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (ready) load();
    }, [ready, load]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!account) {
    return <EmptyState title="Account not found" message="This account may have been deleted." />;
  }

  const createdLabel = new Date(account.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={layoutStyles.screen}>
      <CollapsibleScreenHeader
        title={account.name}
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
        <View
          style={[
            styles.heroCard,
            { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="titleLarge" style={{ fontWeight: '700' }}>
            {account.name}
          </Text>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Current balance
          </Text>
          <Text variant="headlineMedium" style={{ fontWeight: '700' }}>
            {formatCurrency(balance)}
          </Text>
          <View style={styles.heroMeta}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {formatCurrency(account.initialBalance)} starting
            </Text>
            {netWorthShare != null ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {netWorthShare}% of total balance
              </Text>
            ) : null}
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Since {createdLabel}
            </Text>
          </View>
        </View>

        {linkedGoalProgress ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`View goal ${linkedGoalProgress.goal.name}`}
            onPress={() => router.push(`/goal/${linkedGoalProgress.goal.id}`)}
            style={[
              styles.goalCard,
              {
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.surface,
                opacity: linkedGoalProgress.goal.status === 'completed' ? 0.85 : 1,
              },
            ]}
          >
            <View style={styles.goalHeader}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Linked savings goal
                {linkedGoalProgress.goal.status === 'completed' ? ' · Completed' : ''}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
            <Text variant="titleMedium" style={{ fontWeight: '600' }}>
              {linkedGoalProgress.goal.name}
            </Text>
            <Text variant="bodyMedium">
              {formatCurrency(linkedGoalProgress.progress)} of{' '}
              {formatCurrency(linkedGoalProgress.goal.targetAmount)}
            </Text>
            <ProgressBar
              progress={linkedGoalProgress.percent / 100}
              color={theme.colors.income}
              style={styles.bar}
            />
          </Pressable>
        ) : null}

        <View
          style={[
            styles.actionsCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
          ]}
        >
          <Text variant="titleMedium" style={styles.actionsTitle}>
            Account settings
          </Text>
          <Button
            mode="outlined"
            icon="pencil-outline"
            onPress={() => router.push(`/account/edit/${account.id}`)}
            style={styles.actionButton}
          >
            Edit account
          </Button>
          <Button
            mode="outlined"
            icon="delete-outline"
            textColor={theme.colors.error}
            onPress={() => router.push(`/account/delete/${account.id}`)}
            style={styles.actionButton}
          >
            Delete account
          </Button>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1, gap: CARD_GAP, paddingBottom: SCREEN_PADDING },
  heroCard: {
    padding: CARD_PADDING,
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    gap: ROW_BODY_GAP,
  },
  heroMeta: { gap: ROW_BODY_GAP, marginTop: CARD_INNER_GAP },
  goalCard: {
    padding: CARD_PADDING,
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    gap: CARD_INNER_GAP,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bar: layoutStyles.progressBar,
  actionsCard: {
    padding: CARD_PADDING,
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    gap: CARD_INNER_GAP,
  },
  actionsTitle: { fontWeight: '600' },
  actionButton: { alignSelf: 'stretch' },
});
