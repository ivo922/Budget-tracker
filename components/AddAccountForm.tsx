import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Text, TextInput } from 'react-native-paper';
import { FormFieldGroup } from '@/components/FormFieldGroup';
import { FormScreen } from '@/components/FormScreen';
import { FormTextInput } from '@/components/FormTextInput';
import { useApp } from '@/lib/context/AppContext';
import { createAccount } from '@/lib/db/queries';
import { ACCOUNT_COLORS } from '@/lib/format';
import { BORDER_RADIUS } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  onClose: () => void;
  onCreated?: () => void;
};

export function AddAccountForm({ onClose, onCreated }: Props) {
  const { refresh } = useApp();
  const theme = useAppTheme();
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
    <FormScreen
      title="New account"
      onCancel={onClose}
      onConfirm={handleCreate}
      confirmLabel="Create"
      confirmLoading={saving}
    >
      <FormFieldGroup>
        <FormTextInput label="Name" value={name} onChangeText={setName} />
        <FormTextInput
          label="Starting balance"
          value={initialBalance}
          onChangeText={setInitialBalance}
          keyboardType="decimal-pad"
          left={<TextInput.Affix text="$" />}
        />
      </FormFieldGroup>

      <View style={[styles.colorSection, { backgroundColor: theme.colors.outlineVariant }]}>
        <Text
          variant="labelMedium"
          style={{ color: theme.colors.onSurfaceVariant, paddingHorizontal: 14, paddingTop: 10 }}
        >
          Color
        </Text>
        <View style={styles.colorRow}>
          {ACCOUNT_COLORS.map((c) => (
            <IconButton
              key={c}
              icon={color === c ? 'check-circle' : 'circle'}
              iconColor={c}
              onPress={() => setColor(c)}
            />
          ))}
        </View>
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  colorSection: {
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
});
