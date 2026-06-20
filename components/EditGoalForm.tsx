import { FormDatePicker } from '@/components/FormDatePicker';
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { FormFieldButton } from '@/components/FormFieldButton';
import { FormFieldGroup } from '@/components/FormFieldGroup';
import { FormHelperText } from '@/components/FormHelperText';
import { FormScreen } from '@/components/FormScreen';
import { FormTextInput } from '@/components/FormTextInput';
import { useApp } from '@/lib/context/AppContext';
import { getGoalById, getGoalProgress, saveGoalUpdates } from '@/lib/db/queries';
import type { GoalType } from '@/lib/db/schema';
import { formatCurrency } from '@/lib/format';
import { useErrorStyle, useAppTheme } from '@/lib/useAppTheme';

type Props = {
  goalId: string;
  onClose: () => void;
  onSaved?: () => void;
};

export function EditGoalForm({ goalId, onClose, onSaved }: Props) {
  const { refresh } = useApp();
  const theme = useAppTheme();
  const errorStyle = useErrorStyle();
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<GoalType>('savings');
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [startingBalance, setStartingBalance] = useState('0');
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [originalStartingBalance, setOriginalStartingBalance] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [goal, progress] = await Promise.all([getGoalById(goalId), getGoalProgress(goalId)]);
      if (!goal) {
        setLoading(false);
        return;
      }
      setType(goal.type);
      setName(goal.name);
      setTargetAmount(String(goal.targetAmount));
      setStartingBalance(String(goal.startingBalance));
      setOriginalStartingBalance(goal.startingBalance);
      setTargetDate(goal.targetDate ? new Date(goal.targetDate) : null);
      setCurrentProgress(progress?.progress ?? goal.startingBalance);
      setLoading(false);
    })();
  }, [goalId]);

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
    const starting = parseFloat(startingBalance) || 0;
    if (starting < 0) {
      setError('Starting balance cannot be negative');
      return;
    }

    const willComplete = currentProgress >= target;
    const targetDropped = target < currentProgress;

    const persist = async () => {
      setSaving(true);
      await saveGoalUpdates(goalId, {
        name: name.trim(),
        targetAmount: target,
        startingBalance: starting,
        targetDate: targetDate ? targetDate.getTime() : null,
      });
      setSaving(false);
      refresh();
      onSaved?.();
      onClose();
    };

    if (targetDropped) {
      Alert.alert(
        'Target below current progress',
        `Current progress is ${formatCurrency(currentProgress)}. Lowering the target will mark this goal as completed.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: persist },
        ],
      );
      return;
    }

    if (starting > originalStartingBalance) {
      Alert.alert(
        'Increase starting balance?',
        'This will increase your tracked progress immediately.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: persist },
        ],
      );
      return;
    }

    if (willComplete && target > currentProgress) {
      await persist();
      return;
    }

    await persist();
  };

  if (loading) {
    return (
      <FormScreen title="Edit goal" onCancel={onClose}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Loading…</Text>
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title="Edit goal"
      onCancel={onClose}
      onConfirm={handleSave}
      confirmLoading={saving}
    >
      <FormHelperText variant="labelLarge" inset={false}>
        {type === 'loan' ? 'Loan goal' : 'Savings goal'}
      </FormHelperText>
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
        <FormHelperText inset={false}>
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
      </FormFieldGroup>
      <FormDatePicker
        visible={showDatePicker}
        value={targetDate ?? new Date()}
        minimumDate={new Date()}
        onChange={setTargetDate}
        onDismiss={() => setShowDatePicker(false)}
      />
      {error ? <Text style={errorStyle}>{error}</Text> : null}
    </FormScreen>
  );
}
