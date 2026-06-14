import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { FormFieldButton } from '@/components/FormFieldButton';
import { FormFieldGroup } from '@/components/FormFieldGroup';
import { FormHelperText } from '@/components/FormHelperText';
import { FormScreen } from '@/components/FormScreen';
import { FormSection } from '@/components/FormSection';
import { FormTextInput } from '@/components/FormTextInput';
import { GoalTypeSelector } from '@/components/GoalTypeSelector';
import { InlineSelect } from '@/components/InlineSelect';
import { useApp } from '@/lib/context/AppContext';
import {
  backfillGoalTransactions,
  countBackfillableTransactions,
  createGoal,
  getAccounts,
  getActiveGoals,
  isAccountLinkedToActiveGoal,
} from '@/lib/db/queries';
import type { Account, GoalType } from '@/lib/db/schema';
import { useErrorStyle, useAppTheme } from '@/lib/useAppTheme';

type Props = {
  onClose: () => void;
  onSaved?: (goalId?: string) => void;
  initialType?: GoalType;
};

export function AddGoalForm({ onClose, onSaved, initialType = 'savings' }: Props) {
  const router = useRouter();
  const { refresh } = useApp();
  const theme = useAppTheme();
  const errorStyle = useErrorStyle();
  const [type, setType] = useState<GoalType>(initialType);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [startingBalance, setStartingBalance] = useState('0');
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [linkedAccountGoals, setLinkedAccountGoals] = useState<Map<string, string>>(new Map());
  const [accountId, setAccountId] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getAccounts(), getActiveGoals()]).then(([accts, activeGoals]) => {
      setAccounts(accts);
      const map = new Map<string, string>();
      for (const g of activeGoals) {
        if (g.accountId) map.set(g.accountId, g.name);
      }
      setLinkedAccountGoals(map);
    });
  }, []);

  useEffect(() => {
    if (type === 'loan') setAccountId(undefined);
  }, [type]);

  const accountOptions = useMemo(
    () =>
      accounts.map((a) => {
        const linkedGoal = linkedAccountGoals.get(a.id);
        return {
          value: a.id,
          label: linkedGoal ? `${a.name} (linked to ${linkedGoal})` : a.name,
          disabled: Boolean(linkedGoal),
        };
      }),
    [accounts, linkedAccountGoals],
  );

  const selectableAccountOptions = useMemo(
    () => accountOptions.filter((o) => !o.disabled),
    [accountOptions],
  );

  const accountHelper =
    'Deposits and withdrawals on this account track toward your goal automatically.';

  const finishSave = (goalId?: string) => {
    refresh();
    onSaved?.(goalId);
    onClose();
  };

  const promptLinkAccount = (goalId: string) => {
    Alert.alert(
      'Link an account?',
      'Link an account to auto-track transactions toward this goal.',
      [
        { text: 'Skip', style: 'cancel', onPress: () => finishSave(goalId) },
        {
          text: 'Link account',
          onPress: () => {
            refresh();
            onSaved?.(goalId);
            onClose();
            router.push(`/goal/link/${goalId}`);
          },
        },
      ],
    );
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
      targetDate: targetDate ? targetDate.getTime() : null,
      accountId: linkedAccountId,
    });

    if (linkedAccountId) {
      const pendingCount = await countBackfillableTransactions(goal.id);
      setSaving(false);
      if (pendingCount > 0) {
        Alert.alert(
          'Link existing transactions?',
          `Link ${pendingCount} existing transaction${pendingCount === 1 ? '' : 's'} on this account to this goal?`,
          [
            { text: 'Skip', style: 'cancel', onPress: () => finishSave(goal.id) },
            {
              text: 'Link',
              onPress: async () => {
                await backfillGoalTransactions(goal.id);
                finishSave(goal.id);
              },
            },
          ],
        );
        return;
      }
      finishSave(goal.id);
      return;
    }

    setSaving(false);
    if (type === 'savings') {
      promptLinkAccount(goal.id);
      return;
    }
    finishSave(goal.id);
  };

  return (
    <FormScreen
      title="Add goal"
      onCancel={onClose}
      onConfirm={handleSave}
      confirmLoading={saving}
    >
      <FormSection compact>
        <GoalTypeSelector value={type} onChange={setType} />
      </FormSection>

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
        <FormHelperText>
          Money already {type === 'loan' ? 'paid' : 'saved'} before tracking started.
        </FormHelperText>
        <FormFieldButton
          label="Target date (optional)"
          value={targetDate ? targetDate.toLocaleDateString() : 'None'}
          onPress={() => setShowDatePicker(true)}
          icon="calendar-outline"
        />
        {targetDate ? (
          <FormHelperText
            variant="labelMedium"
            style={{ color: theme.colors.primary }}
            onPress={() => setTargetDate(null)}
          >
            Clear target date
          </FormHelperText>
        ) : null}
        {type === 'savings' ? (
          <>
            <InlineSelect
              label="Linked account (optional)"
              value={accountId}
              options={selectableAccountOptions}
              onChange={setAccountId}
              allowClear
              clearLabel="None"
            />
            {accountId ? <FormHelperText>{accountHelper}</FormHelperText> : null}
          </>
        ) : null}
      </FormFieldGroup>
      {showDatePicker ? (
        <DateTimePicker
          value={targetDate ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={(_, selected) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selected) setTargetDate(selected);
          }}
        />
      ) : null}
      {error ? <Text style={errorStyle}>{error}</Text> : null}
    </FormScreen>
  );
}
