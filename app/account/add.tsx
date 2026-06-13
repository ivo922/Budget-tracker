import { useRouter } from 'expo-router';
import React from 'react';
import { AddAccountForm } from '@/components/AddAccountForm';

export default function AddAccountScreen() {
  const router = useRouter();

  return <AddAccountForm onClose={() => router.back()} />;
}
