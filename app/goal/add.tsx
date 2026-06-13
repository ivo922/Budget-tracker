import { useRouter } from 'expo-router';
import React from 'react';
import { AddGoalForm } from '@/components/AddGoalForm';

export default function AddGoalScreen() {
  const router = useRouter();

  return <AddGoalForm onClose={() => router.back()} />;
}
