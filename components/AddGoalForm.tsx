import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { FormFieldGroup } from '@/components/FormFieldGroup';
import { FormScreen } from '@/components/FormScreen';
import { FormTextInput } from '@/components/FormTextInput';
import { GoalTypeSelector } from '@/components/GoalTypeSelector';
import { InlineSelect } from '@/components/InlineSelect';
import { useApp } from '@/lib/context/AppContext';
import {
  backfillGoalTransactions,
  countBackfillableTransactions,
  createGoal,
  getAccounts,
  isAccountLinkedToActiveGoal,
} from '@/lib/db/queries';
import type { Account, GoalType } from '@/lib/db/schema';
import { useErrorStyle, useAppTheme } from '@/lib/useAppTheme';

type Props = {
  onClose: () => void;
  onSaved?: () => void;
};

export function AddGoalForm({ onClose, onSaved }: Props) {
  const { refresh } = useApp();
  const theme = useAppTheme();
  const errorStyle = useErrorStyle();
  const [type, setType] = useState<GoalType>('savings');
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [startingBalance, setStartingBalance] = useState('0');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const accountOptions = useMemo(
    () => accounts.map((a) => ({ value: a.id, label: a.name })),
    [accounts],
  );

  useEffect(() => {
    getAccounts().then(setAccounts);
  }, []);

  useEffect(() => {
    if (type === 'loan') setAccountId(undefined);
  }, [type]);

  const accountHelper =
    'Deposits and withdrawals on this account track toward your goal automatically.';

  const finishSave = () => {
    refresh();
    onSaved?.();
    onClose();
  };

  const handleSave = async () => {
    setError('');
    if (!name.trim()) {
      setError('Enter a name');
      return;
    }
    const target = parseFloat(targetAmount);
    if (!target || target <= 0) {
      setError('Enter a positive target amount');
      return;
    }
    if (type === 'savings' && accountId && (await isAccountLinkedToActiveGoal(accountId))) {
      setError('This account is already linked to another active goal');
      return;
    }

    setSaving(true);
    const linkedAccountId = type === 'savings' ? (accountId ?? null) : null;
    const goal = await createGoal({
      name: name.trim(),
      type,
      targetAmount: target,
      startingBalance: parseFloat(startingBalance) || 0,
      targetDate: null,
      accountId: linkedAccountId,
    });

    if (linkedAccountId) {
      const pendingCount = await countBackfillableTransactions(goal.id);
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
                await backfillGoalTransactions(goal.id);
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

  return (
    <FormScreen
      title="Add goal"
      onCancel={onClose}
      onConfirm={handleSave}
      confirmLoading={saving}
    >
      <GoalTypeSelector value={type} onChange={setType} />
      <FormFieldGroup>
        <FormTextInput label="Name" value={name} onChangeText={setName} />
        <FormTextInput
          label="Target amount"
          value={targetAmount}
          onChangeText={setTargetAmount}
          keyboardType="decimal-pad"
          left={<TextInput.Affix text="$" />}
        />
        <FormTextInput
          label={type === 'loan' ? 'Already paid' : 'Already saved'}
          value={startingBalance}
          onChangeText={setStartingBalance}
          keyboardType="decimal-pad"
          left={<TextInput.Affix text="$" />}
        />
        {type === 'savings' ? (
          <>
            <InlineSelect
              label="Linked account (optional)"
              value={accountId}
              options={accountOptions}
              onChange={setAccountId}
              allowClear
              clearLabel="None"
            />
            {accountId ? (
              <Text variant="bodySmall" style={[styles.accountHelper, { color: theme.colors.onSurfaceVariant }]}>
                {accountHelper}
              </Text>
            ) : null}
          </>
        ) : null}
      </FormFieldGroup>
      {error ? <Text style={errorStyle}>{error}</Text> : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  accountHelper: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
});
