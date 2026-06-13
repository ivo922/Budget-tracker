import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text } from 'react-native-paper';
import { FormFieldGroup } from '@/components/FormFieldGroup';
import { FormScreen } from '@/components/FormScreen';
import { useApp } from '@/lib/context/AppContext';
import {
  countTransactionsForCategory,
  deleteAccount,
  deleteCategory,
  deleteGoal,
  deleteTransaction,
} from '@/lib/db/queries';
import { popupStyles } from '@/lib/popupStyles';
import { useAppTheme, useErrorStyle } from '@/lib/useAppTheme';

export default function ConfirmScreen() {
  const router = useRouter();
  const { refresh } = useApp();
  const theme = useAppTheme();
  const errorStyle = useErrorStyle();
  const params = useLocalSearchParams<{
    type: string;
    id: string;
    title: string;
    message: string;
    confirmLabel?: string;
    dismiss?: string;
  }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!params.id || !params.type) return;
    setLoading(true);
    setError('');

    try {
      switch (params.type) {
        case 'category': {
          const txCount = await countTransactionsForCategory(params.id);
          if (txCount > 0) {
            setError('Cannot delete — category has transactions.');
            setLoading(false);
            return;
          }
          const result = await deleteCategory(params.id);
          if (!result.ok) {
            setError(result.reason ?? 'Cannot delete');
            setLoading(false);
            return;
          }
          break;
        }
        case 'account':
          await deleteAccount(params.id);
          break;
        case 'goal':
          await deleteGoal(params.id);
          break;
        case 'transaction':
          await deleteTransaction(params.id);
          break;
        default:
          setLoading(false);
          return;
      }

      refresh();
      const dismiss = parseInt(params.dismiss ?? '1', 10);
      if (dismiss > 1) {
        router.dismiss(dismiss);
      } else {
        router.back();
      }
    } catch {
      setError('Something went wrong.');
      setLoading(false);
    }
  };

  return (
    <FormScreen
      title={params.title ?? 'Confirm'}
      onCancel={() => router.back()}
      onConfirm={handleConfirm}
      confirmLabel={params.confirmLabel ?? 'Delete'}
      confirmLoading={loading}
      confirmDestructive
    >
      <FormFieldGroup>
        <Text
          variant="bodyLarge"
          style={[popupStyles.message, { color: theme.colors.onSurface, padding: 14 }]}
        >
          {params.message}
        </Text>
      </FormFieldGroup>
      {error ? <Text style={errorStyle}>{error}</Text> : null}
    </FormScreen>
  );
}
