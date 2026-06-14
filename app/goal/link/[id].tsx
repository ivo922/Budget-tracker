import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { LinkGoalAccountForm } from '@/components/LinkGoalAccountForm';

export default function LinkGoalAccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  if (!id) return null;

  return <LinkGoalAccountForm goalId={id} onClose={() => router.back()} />;
}
