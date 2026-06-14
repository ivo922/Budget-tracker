import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, RadioButton, Text } from 'react-native-paper';
import { EmptyState } from '@/components/EmptyState';
import { FormFieldGroup } from '@/components/FormFieldGroup';
import { FormHelperText } from '@/components/FormHelperText';
import { FormScreen } from '@/components/FormScreen';
import { FormSection } from '@/components/FormSection';
import { InlineSelect } from '@/components/InlineSelect';
import { useApp } from '@/lib/context/AppContext';
import {
  deleteAccountWithOptions,
  getAccountDeletePreview,
  type AccountDeletePreview,
  type DeleteAccountOptions,
} from '@/lib/db/queries';
import { formatCurrency } from '@/lib/format';
import { CARD_INNER_GAP, layoutStyles, ROW_PADDING_H, ROW_PADDING_V } from '@/lib/layout';
import { useAppTheme, useErrorStyle } from '@/lib/useAppTheme';

type GoalHandling = 'reassign' | 'unlink' | 'delete';

export default function DeleteAccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { refresh } = useApp();
  const theme = useAppTheme();
  const errorStyle = useErrorStyle();
  const [preview, setPreview] = useState<AccountDeletePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [transferToId, setTransferToId] = useState<string | undefined>();
  const [goalHandling, setGoalHandling] = useState<GoalHandling>('reassign');
  const [goalReassignToId, setGoalReassignToId] = useState<string | undefined>();

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const data = await getAccountDeletePreview(id);
    setPreview(data);
    if (data && data.otherAccounts.length > 0) {
      const defaultDest = data.otherAccounts[0].id;
      setTransferToId(defaultDest);
      setGoalReassignToId(defaultDest);
    }
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (transferToId && goalHandling === 'reassign' && !goalReassignToId) {
      setGoalReassignToId(transferToId);
    }
  }, [transferToId, goalHandling, goalReassignToId]);

  const destinationOptions = useMemo(
    () =>
      (preview?.otherAccounts ?? []).map((a) => ({
        value: a.id,
        label: a.name,
      })),
    [preview],
  );

  const transferDestName = destinationOptions.find((o) => o.value === transferToId)?.label;

  const handleDelete = async () => {
    if (!id || !preview) return;
    setSaving(true);
    setError('');

    const options: DeleteAccountOptions = {};

    if (preview.balance > 0) {
      if (!transferToId) {
        setError('Select a destination account for remaining funds.');
        setSaving(false);
        return;
      }
      options.transferToAccountId = transferToId;
    }

    if (preview.linkedGoal) {
      options.goalHandling = goalHandling;
      if (goalHandling === 'reassign') {
        if (!goalReassignToId) {
          setError('Select an account to reassign the savings goal to.');
          setSaving(false);
          return;
        }
        options.goalReassignToAccountId = goalReassignToId;
      }
    }

    const result = await deleteAccountWithOptions(id, options);
    if (!result.ok) {
      setError(result.reason);
      setSaving(false);
      return;
    }

    refresh();
    router.replace('/(tabs)');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!preview) {
    return <EmptyState title="Account not found" message="This account may have been deleted." />;
  }

  const { account } = preview;
  const hasPositiveBalance = preview.balance > 0;
  const showGoalReassignPicker = preview.linkedGoal != null && goalHandling === 'reassign';

  return (
    <FormScreen
      title={`Delete ${account.name}`}
      onCancel={() => router.back()}
      onConfirm={preview.canDelete ? handleDelete : undefined}
      confirmLabel="Delete"
      confirmLoading={saving}
      confirmDestructive
    >
      <FormSection>
        <View style={styles.accountRow}>
          <View style={[styles.colorDot, { backgroundColor: account.color }]} />
          <Text variant="titleMedium" style={{ fontWeight: '600' }}>
            {account.name}
          </Text>
        </View>
        <Text variant="bodyLarge" style={{ fontWeight: '600' }}>
          {formatCurrency(preview.balance)} current balance
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {preview.txCount} transaction{preview.txCount === 1 ? '' : 's'} will be permanently deleted.
        </Text>
        {preview.linkedGoal ? (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Linked savings goal: {preview.linkedGoal.name}
          </Text>
        ) : null}
      </FormSection>

      <FormFieldGroup>
        <FormHelperText variant="bodyMedium">
          All transactions involving this account will be permanently removed. This cannot be undone.
        </FormHelperText>

        {preview.blockReason ? (
          <Text style={[errorStyle, layoutStyles.formField]}>{preview.blockReason}</Text>
        ) : null}

        {hasPositiveBalance && destinationOptions.length > 0 ? (
          <>
            <InlineSelect
              label={`Move ${formatCurrency(preview.balance)} to`}
              value={transferToId}
              options={destinationOptions}
              onChange={setTransferToId}
            />
            <FormHelperText>
              Balance will be added to {transferDestName ?? 'the destination account'}'s starting
              balance. No transfer record is created.
            </FormHelperText>
          </>
        ) : null}

        {preview.linkedGoal ? (
          <View style={styles.goalSection}>
            <Text variant="titleSmall" style={styles.goalTitle}>
              Linked savings goal
            </Text>
            <RadioButton.Group
              onValueChange={(v) => setGoalHandling(v as GoalHandling)}
              value={goalHandling}
            >
              <RadioButton.Item
                label="Reassign goal to another account"
                value="reassign"
                position="leading"
              />
              <RadioButton.Item label="Unlink goal from any account" value="unlink" position="leading" />
              <RadioButton.Item label="Delete goal" value="delete" position="leading" />
            </RadioButton.Group>
            {showGoalReassignPicker ? (
              <InlineSelect
                label="Reassign goal to"
                value={goalReassignToId}
                options={destinationOptions}
                onChange={setGoalReassignToId}
              />
            ) : null}
          </View>
        ) : null}
      </FormFieldGroup>

      {error ? <Text style={errorStyle}>{error}</Text> : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CARD_INNER_GAP,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  goalSection: {
    gap: CARD_INNER_GAP,
  },
  goalTitle: {
    fontWeight: '600',
    paddingHorizontal: ROW_PADDING_H,
    paddingTop: ROW_PADDING_V,
  },
});
