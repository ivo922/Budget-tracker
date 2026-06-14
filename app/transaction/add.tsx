import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { AddTransactionForm } from '@/components/AddTransactionForm';

export default function AddTransactionScreen() {
  const router = useRouter();
  const { accountId } = useLocalSearchParams<{ accountId?: string }>();

  return (
    <AddTransactionForm
      onClose={() => router.back()}
      initialAccountId={accountId}
    />
  );
}
