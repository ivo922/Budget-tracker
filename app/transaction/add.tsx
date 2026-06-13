import { useRouter } from 'expo-router';
import React from 'react';
import { AddTransactionForm } from '@/components/AddTransactionForm';

export default function AddTransactionScreen() {
  const router = useRouter();

  return <AddTransactionForm onClose={() => router.back()} />;
}
