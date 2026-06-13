import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ActivityIndicator, Divider, FAB } from 'react-native-paper';
import { AccountListItem } from '@/components/AccountListItem';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import { useApp } from '@/lib/context/AppContext';
import {
  getAccountBalance,
  getAccounts,
} from '@/lib/db/queries';
import type { Account } from '@/lib/db/schema';
import { BORDER_RADIUS, layoutStyles, SCREEN_PADDING } from '@/lib/layout';
import { navigateToConfirm } from '@/lib/navigateConfirm';
import { useAppTheme } from '@/lib/useAppTheme';

type AccountWithBalance = Account & { balance: number };

export default function AccountsScreen() {
  const router = useRouter();
  const { ready } = useApp();
  const theme = useAppTheme();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyle } = useCollapsibleHeader();
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await getAccounts();
    const withBalances = await Promise.all(
      rows.map(async (a) => ({ ...a, balance: await getAccountBalance(a.id) })),
    );
    setAccounts(withBalances);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (ready) load();
    }, [ready, load]),
  );

  const confirmDelete = (account: AccountWithBalance) => {
    navigateToConfirm(router, {
      type: 'account',
      id: account.id,
      title: 'Delete account?',
      message: `This will delete "${account.name}" and all its transactions. This cannot be undone.`,
    });
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
      <CollapsibleScreenHeader title="Accounts" scrollY={scrollY} headerHeight={headerHeight} />
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[scrollContentStyle, accounts.length === 0 && styles.emptyScroll]}
      >
        {accounts.length === 0 ? (
          <EmptyState title="No accounts" message="Create an account to start tracking balances." />
        ) : (
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            {accounts.map((account, index) => (
              <View key={account.id}>
                <AccountListItem
                  account={account}
                  onPress={() => router.push(`/account/${account.id}`)}
                  onDelete={() => confirmDelete(account)}
                />
                {index < accounts.length - 1 ? (
                  <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />
                ) : null}
              </View>
            ))}
          </View>
        )}
      </Animated.ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => router.push('/account/add')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyScroll: { flexGrow: 1 },
  card: {
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    marginBottom: 12,
  },
  fab: { position: 'absolute', right: SCREEN_PADDING, bottom: SCREEN_PADDING },
});
