import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { FormFieldGroup } from '@/components/FormFieldGroup';
import { FormHelperText } from '@/components/FormHelperText';
import { FormScreen } from '@/components/FormScreen';
import { InlineSelect } from '@/components/InlineSelect';
import { useApp } from '@/lib/context/AppContext';
import {
  backfillGoalTransactions,
  countBackfillableTransactions,
  getAccounts,
  getGoalById,
  setGoalLinkedAccount,
} from '@/lib/db/queries';
import type { Account, Goal } from '@/lib/db/schema';
import { useErrorStyle, useAppTheme } from '@/lib/useAppTheme';

type Props = {
  goalId: string;
  onClose: () => void;
  onSaved?: () => void;
};

export function LinkGoalAccountForm({ goalId, onClose, onSaved }: Props) {
  const { refresh } = useApp();
  const theme = useAppTheme();
  const errorStyle = useErrorStyle();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const accountOptions = useMemo(
    () => accounts.map((a) => ({ value: a.id, label: a.name })),
    [accounts],
  );

  useEffect(() => {
    Promise.all([getGoalById(goalId), getAccounts()]).then(([goalRow, accountRows]) => {
      setGoal(goalRow ?? null);
      setAccounts(accountRows);
      setAccountId(goalRow?.accountId ?? undefined);
      setLoading(false);
    });
  }, [goalId]);

  const accountHelper =
    'Deposits and withdrawals on this account track toward your goal automatically.';

  const finishSave = () => {
    refresh();
    onSaved?.();
    onClose();
  };

  const handleSave = async () => {
    if (!goal) return;
    setError('');

    const linkedAccountId = accountId ?? null;
    if (linkedAccountId === goal.accountId) {
      onClose();
      return;
    }

    setSaving(true);
    const result = await setGoalLinkedAccount(goalId, linkedAccountId);
    if (!result.ok) {
      setError(result.reason);
      setSaving(false);
      return;
    }

    if (linkedAccountId) {
      const pendingCount = await countBackfillableTransactions(goalId);
      if (pendingCount > 0) {
        setSaving(false);
        Alert.alert(
          'Link existing transactions?',
          `Link ${pendingCount} existing transaction${pendingCount === 1 ? '' : 's'} on this account to this goal?`,
          [
            { text: 'Skip', style: 'cancel', onPress: finishSave },
            {
              text: 'Link',
              onPress: async () => {
                await backfillGoalTransactions(goalId);
                finishSave();
              },
            },
          ],
        );
        return;
      }
    }

    setSaving(false);
    finishSave();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!goal || goal.type !== 'savings') {
    return (
      <FormScreen title="Link account" onCancel={onClose}>
        <Text style={errorStyle}>Only savings goals can link an account.</Text>
      </FormScreen>
    );
  }

  if (goal.status !== 'active') {
    return (
      <FormScreen title="Link account" onCancel={onClose}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>
          This goal is {goal.status}. Account linking is only available for active goals.
        </Text>
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title="Link account"
      onCancel={onClose}
      onConfirm={handleSave}
      confirmLoading={saving}
    >
      <FormFieldGroup>
        <FormHelperText variant="bodyMedium">{goal.name}</FormHelperText>
        <InlineSelect
          label="Linked account"
          value={accountId}
          options={accountOptions}
          onChange={setAccountId}
          allowClear
          clearLabel="None"
        />
        {accountId ? <FormHelperText>{accountHelper}</FormHelperText> : null}
      </FormFieldGroup>
      {error ? <Text style={errorStyle}>{error}</Text> : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
