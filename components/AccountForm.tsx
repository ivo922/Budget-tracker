import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Text, TextInput } from 'react-native-paper';
import { FormFieldGroup } from '@/components/FormFieldGroup';
import { FormScreen } from '@/components/FormScreen';
import { FormTextInput } from '@/components/FormTextInput';
import { useApp } from '@/lib/context/AppContext';
import { createAccount, updateAccount } from '@/lib/db/queries';
import type { Account } from '@/lib/db/schema';
import { ACCOUNT_COLORS, formatCurrency } from '@/lib/format';
import { BORDER_RADIUS } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  mode: 'create' | 'edit';
  account?: Account;
  onClose: () => void;
  onSaved?: () => void;
  onDelete?: () => void;
};

export function AccountForm({ mode, account, onClose, onSaved, onDelete }: Props) {
  const { refresh } = useApp();
  const theme = useAppTheme();
  const [name, setName] = useState(account?.name ?? '');
  const [initialBalance, setInitialBalance] = useState(
    account ? String(account.initialBalance) : '0',
  );
  const [color, setColor] = useState(account?.color ?? ACCOUNT_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    if (mode === 'create') {
      await createAccount({
        name: name.trim(),
        color,
        initialBalance: parseFloat(initialBalance) || 0,
      });
    } else if (account) {
      await updateAccount(account.id, { name: name.trim(), color });
    }
    setSaving(false);
    refresh();
    onSaved?.();
    onClose();
  };

  return (
    <FormScreen
      title={mode === 'create' ? 'New account' : 'Edit account'}
      onCancel={onClose}
      onConfirm={handleSave}
      confirmLabel={mode === 'create' ? 'Create' : 'Save'}
      confirmLoading={saving}
      onSecondary={mode === 'edit' && onDelete ? onDelete : undefined}
      secondaryLabel={mode === 'edit' && onDelete ? 'Delete' : undefined}
      secondaryDestructive
    >
      <FormFieldGroup>
        <FormTextInput label="Name" value={name} onChangeText={setName} />
        {mode === 'create' ? (
          <FormTextInput
            label="Starting balance"
            value={initialBalance}
            onChangeText={setInitialBalance}
            keyboardType="decimal-pad"
            left={<TextInput.Affix text="$" />}
          />
        ) : account ? (
          <View style={styles.readOnlyField}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Starting balance
            </Text>
            <Text variant="bodyLarge" style={{ fontWeight: '600' }}>
              {formatCurrency(account.initialBalance)}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Adjust via transactions or delete and recreate the account.
            </Text>
          </View>
        ) : null}
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
  readOnlyField: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
});
