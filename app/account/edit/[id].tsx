import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { AccountForm } from '@/components/AccountForm';
import { EmptyState } from '@/components/EmptyState';
import { getAccountById } from '@/lib/db/queries';
import type { Account } from '@/lib/db/schema';

export default function EditAccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const row = await getAccountById(id);
    setAccount(row ?? null);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!account) {
    return <EmptyState title="Account not found" message="This account may have been deleted." />;
  }

  return (
    <AccountForm
      mode="edit"
      account={account}
      onClose={() => router.back()}
      onDelete={() => router.push(`/account/delete/${account.id}`)}
    />
  );
}
