import React, { useState } from 'react';
import { Text, TextInput } from 'react-native-paper';
import { FormFieldGroup } from '@/components/FormFieldGroup';
import { FormScreen } from '@/components/FormScreen';
import { FormTextInput } from '@/components/FormTextInput';
import { GoalTypeSelector } from '@/components/GoalTypeSelector';
import { useApp } from '@/lib/context/AppContext';
import { createGoal } from '@/lib/db/queries';
import type { GoalType } from '@/lib/db/schema';
import { useErrorStyle } from '@/lib/useAppTheme';

type Props = {
  onClose: () => void;
  onSaved?: () => void;
};

export function AddGoalForm({ onClose, onSaved }: Props) {
  const { refresh } = useApp();
  const errorStyle = useErrorStyle();
  const [type, setType] = useState<GoalType>('savings');
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [startingBalance, setStartingBalance] = useState('0');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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

    setSaving(true);
    await createGoal({
      name: name.trim(),
      type,
      targetAmount: target,
      startingBalance: parseFloat(startingBalance) || 0,
      targetDate: null,
      accountId: null,
    });
    setSaving(false);
    refresh();
    onSaved?.();
    onClose();
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
      </FormFieldGroup>
      {error ? <Text style={errorStyle}>{error}</Text> : null}
    </FormScreen>
  );
}
