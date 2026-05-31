import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, FAB } from 'react-native-paper';
import { AccountListItem } from '@/components/AccountListItem';
import { AddAccountForm } from '@/components/AddAccountForm';
import { ConfirmPopup } from '@/components/ConfirmPopup';
import { EmptyState } from '@/components/EmptyState';
import { FormPopup } from '@/components/FormPopup';
import { useApp } from '@/lib/context/AppContext';
import {
  deleteAccount,
  getAccountBalance,
  getAccounts,
} from '@/lib/db/queries';
import type { Account } from '@/lib/db/schema';
import { layoutStyles, screenListContentStyle, SCREEN_PADDING } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type AccountWithBalance = Account & { balance: number };

export default function AccountsScreen() {
  const router = useRouter();
  const { ready, refresh } = useApp();
  const theme = useAppTheme();
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [createVisible, setCreateVisible] = useState(false);
  const [createKey, setCreateKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<AccountWithBalance | null>(null);

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

  const openCreate = () => {
    setCreateKey((k) => k + 1);
    setCreateVisible(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteAccount(deleteTarget.id);
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
      {accounts.length === 0 ? (
        <View style={screenListContentStyle}>
          <EmptyState title="No accounts" message="Create an account to start tracking balances." />
        </View>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={screenListContentStyle}
          renderItem={({ item }) => (
            <AccountListItem
              account={item}
              onPress={() => router.push(`/account/${item.id}`)}
              onDelete={() => setDeleteTarget(item)}
            />
          )}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={openCreate}
      />

      <FormPopup visible={createVisible} onClose={() => setCreateVisible(false)} contentKey={createKey}>
        <AddAccountForm
          onClose={() => setCreateVisible(false)}
          onCreated={() => {
            load();
            setCreateVisible(false);
          }}
        />
      </FormPopup>

      <ConfirmPopup
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete account?"
        message={`This will delete "${deleteTarget?.name}" and all its transactions. This cannot be undone.`}
        onConfirm={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', right: SCREEN_PADDING, bottom: SCREEN_PADDING },
});
