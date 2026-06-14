import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { AddGoalForm } from '@/components/AddGoalForm';
import type { GoalType } from '@/lib/db/schema';

export default function AddGoalScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: GoalType }>();

  return (
    <AddGoalForm
      onClose={() => router.back()}
      initialType={type === 'loan' ? 'loan' : 'savings'}
    />
  );
}
