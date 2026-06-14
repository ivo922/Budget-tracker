import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Text, TextInput } from 'react-native-paper';
import { FormFieldGroup } from '@/components/FormFieldGroup';
import { FormHelperText } from '@/components/FormHelperText';
import { FormScreen } from '@/components/FormScreen';
import { FormSection } from '@/components/FormSection';
import { FormTextInput } from '@/components/FormTextInput';
import { useApp } from '@/lib/context/AppContext';
import { createAccount, updateAccount } from '@/lib/db/queries';
import type { Account } from '@/lib/db/schema';
import { ACCOUNT_COLORS, formatCurrency } from '@/lib/format';
import { layoutStyles } from '@/lib/layout';
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
          <View style={layoutStyles.formField}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Starting balance
            </Text>
            <Text variant="bodyLarge" style={{ fontWeight: '600' }}>
              {formatCurrency(account.initialBalance)}
            </Text>
            <FormHelperText inset={false}>
              Adjust via transactions or delete and recreate the account.
            </FormHelperText>
          </View>
        ) : null}
      </FormFieldGroup>

      <FormSection>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
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
      </FormSection>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
});
