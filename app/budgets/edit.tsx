import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { BudgetEditorForm } from '@/components/BudgetEditorForm';

export default function BudgetEditScreen() {
  const router = useRouter();
  const { year, month } = useLocalSearchParams<{ year?: string; month?: string }>();
  const now = new Date();

  return (
    <BudgetEditorForm
      year={year ? parseInt(year, 10) : now.getFullYear()}
      month={month ? parseInt(month, 10) : now.getMonth() + 1}
      onClose={() => router.back()}
    />
  );
}
