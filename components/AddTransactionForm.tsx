import React, { useState } from 'react';
import { FormScreen } from '@/components/FormScreen';
import { TransactionFormFields } from '@/components/TransactionFormFields';
import { useTransactionForm } from '@/hooks/useTransactionForm';
import { useApp } from '@/lib/context/AppContext';
import { createTransaction } from '@/lib/db/queries';

type Props = {
  onClose: () => void;
  onSaved?: () => void;
  initialAccountId?: string;
};

export function AddTransactionForm({ onClose, onSaved, initialAccountId }: Props) {
  const { refresh } = useApp();
  const [saving, setSaving] = useState(false);
  const form = useTransactionForm({ mode: 'add', initialAccountId });

  const handleSave = async () => {
    const result = form.buildPayload();
    if (!result.ok) return;

    setSaving(true);
    const { payload } = result;
    if (payload.type === 'transfer') {
      await createTransaction({
        type: 'transfer',
        amount: payload.amount,
        accountId: null,
        categoryId: null,
        fromAccountId: payload.fromAccountId,
        toAccountId: payload.toAccountId,
        goalId: null,
        note: payload.note,
        date: payload.date,
      });
    } else {
      await createTransaction({
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
    onSaved?.();
    onClose();
  };

  return (
    <FormScreen
      title="Add transaction"
      onCancel={onClose}
      onConfirm={handleSave}
      confirmLoading={saving}
    >
      <TransactionFormFields form={form} mode="add" />
    </FormScreen>
  );
}
