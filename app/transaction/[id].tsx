import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { FormScreen } from '@/components/FormScreen';
import { ScreenLoading } from '@/components/ScreenLoading';
import { TransactionFormFields } from '@/components/TransactionFormFields';
import { useTransactionForm } from '@/hooks/useTransactionForm';
import { useApp } from '@/lib/context/AppContext';
import { getTransactionById, updateTransaction } from '@/lib/db/queries';
import type { Transaction } from '@/lib/db/schema';
import { navigateToConfirm } from '@/lib/navigateConfirm';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [original, setOriginal] = useState<Transaction | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const tx = await getTransactionById(id);
    setOriginal(tx ?? null);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) return <ScreenLoading />;
  if (!original) {
    return <EmptyState title="Not found" message="This transaction no longer exists." />;
  }

  return <EditTransactionForm original={original} />;
}

function EditTransactionForm({ original }: { original: Transaction }) {
  const router = useRouter();
  const { refresh } = useApp();
  const [saving, setSaving] = useState(false);
  const form = useTransactionForm({ mode: 'edit', initialTx: original });

  const handleSave = async () => {
    const result = form.buildPayload();
    if (!result.ok) return;

    setSaving(true);
    const { payload } = result;
    if (payload.type === 'transfer') {
      await updateTransaction(original.id, {
        type: 'transfer',
        amount: payload.amount,
        accountId: null,
        categoryId: null,
        fromAccountId: payload.fromAccountId,
        toAccountId: payload.toAccountId,
        goalId: payload.goalId ?? null,
        note: payload.note,
        date: payload.date,
        paid: payload.paid ?? true,
      });
    } else {
      await updateTransaction(original.id, {
        type: payload.type,
        amount: payload.amount,
        accountId: payload.accountId,
        categoryId: payload.categoryId,
        fromAccountId: null,
        toAccountId: null,
        goalId: payload.goalId,
        note: payload.note,
        date: payload.date,
        paid: payload.paid,
      });
    }
    setSaving(false);
    refresh();
    router.back();
  };

  const handleDelete = () => {
    navigateToConfirm(router, {
      type: 'transaction',
      id: original.id,
      title: 'Delete transaction?',
      message: 'This action cannot be undone.',
      dismiss: 2,
    });
  };

  return (
    <FormScreen
      title="Edit transaction"
      onCancel={() => router.back()}
      onConfirm={handleSave}
      confirmLoading={saving}
      onSecondary={handleDelete}
      secondaryLabel="Delete"
      secondaryDestructive
    >
      <TransactionFormFields form={form} mode="edit" />
    </FormScreen>
  );
}
