import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  FAB,
  IconButton,
  List,
  Portal,
  Dialog,
  Button,
  TextInput,
  Text,
} from 'react-native-paper';
import { EmptyState } from '@/components/EmptyState';
import { useApp } from '@/lib/context/AppContext';
import {
  createAccount,
  deleteAccount,
  getAccountBalance,
  getAccounts,
} from '@/lib/db/queries';
import type { Account } from '@/lib/db/schema';
import { formatCurrency, ACCOUNT_COLORS } from '@/lib/format';
import { useAppTheme } from '@/lib/useAppTheme';

type AccountWithBalance = Account & { balance: number };

export default function AccountsScreen() {
  const router = useRouter();
  const { ready, refresh } = useApp();
  const theme = useAppTheme();
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);
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

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createAccount({
      name: name.trim(),
      color,
      initialBalance: parseFloat(initialBalance) || 0,
    });
    setDialogVisible(false);
    setName('');
    setInitialBalance('0');
    refresh();
    load();
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
    <View style={styles.container}>
      {accounts.length === 0 ? (
        <EmptyState title="No accounts" message="Create an account to start tracking balances." />
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <List.Item
              title={item.name}
              description={formatCurrency(item.balance)}
              onPress={() => router.push(`/account/${item.id}`)}
              left={() => <List.Icon icon="circle" color={item.color} />}
              right={() => (
                <IconButton icon="delete" onPress={() => setDeleteTarget(item)} />
              )}
            />
          )}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => setDialogVisible(true)}
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>New account</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Name" value={name} onChangeText={setName} style={styles.input} />
            <TextInput
              label="Starting balance"
              value={initialBalance}
              onChangeText={setInitialBalance}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Text variant="labelMedium" style={styles.colorLabel}>
              Color
            </Text>
            <View style={styles.colors}>
              {ACCOUNT_COLORS.map((c) => (
                <IconButton
                  key={c}
                  icon={color === c ? 'check-circle' : 'circle'}
                  iconColor={c}
                  onPress={() => setColor(c)}
                />
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCreate}>Create</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={!!deleteTarget} onDismiss={() => setDeleteTarget(null)}>
          <Dialog.Title>Delete account?</Dialog.Title>
          <Dialog.Content>
            <Text>
              This will delete "{deleteTarget?.name}" and all its transactions. This cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteTarget(null)}>Cancel</Button>
            <Button textColor={theme.colors.error} onPress={handleDelete}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  input: { marginBottom: 8 },
  colorLabel: { marginTop: 4 },
  colors: { flexDirection: 'row', flexWrap: 'wrap' },
});
