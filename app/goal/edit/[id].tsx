import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { EditGoalForm } from '@/components/EditGoalForm';

export default function EditGoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  if (!id) return null;

  return <EditGoalForm goalId={id} onClose={() => router.back()} />;
}
