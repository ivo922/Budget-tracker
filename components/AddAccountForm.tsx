import React, { useState } from 'react';
import { View } from 'react-native';
import { IconButton, Text, TextInput } from 'react-native-paper';
import { PopupSheet } from '@/components/PopupSheet';
import { useApp } from '@/lib/context/AppContext';
import { createAccount } from '@/lib/db/queries';
import { ACCOUNT_COLORS } from '@/lib/format';
import { popupStyles } from '@/lib/popupStyles';

type Props = {
  onClose: () => void;
  onCreated?: () => void;
};

export function AddAccountForm({ onClose, onCreated }: Props) {
  const { refresh } = useApp();
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('0');
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await createAccount({
      name: name.trim(),
      color,
      initialBalance: parseFloat(initialBalance) || 0,
    });
    setSaving(false);
    refresh();
    onCreated?.();
    onClose();
  };

  return (
    <PopupSheet
      title="New account"
      onCancel={onClose}
      onConfirm={handleCreate}
      confirmLabel="Create"
      confirmLoading={saving}
    >
      <TextInput label="Name" value={name} onChangeText={setName} style={popupStyles.input} />
      <TextInput
        label="Starting balance"
        value={initialBalance}
        onChangeText={setInitialBalance}
        keyboardType="decimal-pad"
        style={popupStyles.input}
        left={<TextInput.Affix text="$" />}
      />
      <Text variant="labelMedium">Color</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {ACCOUNT_COLORS.map((c) => (
          <IconButton
            key={c}
            icon={color === c ? 'check-circle' : 'circle'}
            iconColor={c}
            onPress={() => setColor(c)}
          />
        ))}
      </View>
    </PopupSheet>
  );
}
