import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { FormFieldButton } from '@/components/FormFieldButton';
import { FormFieldGroup } from '@/components/FormFieldGroup';
import { FormScreen } from '@/components/FormScreen';
import { FormTextInput } from '@/components/FormTextInput';
import { InlineSelect } from '@/components/InlineSelect';
import { TransactionTypeSelector } from '@/components/TransactionTypeSelector';
import { useApp } from '@/lib/context/AppContext';
import {
  createTransaction,
  getAccounts,
  getActiveGoalByAccountId,
  getActiveGoals,
  getParentCategories,
  getSubcategories,
} from '@/lib/db/queries';
import type { Account, Category, Goal, TransactionType } from '@/lib/db/schema';
import { useErrorStyle } from '@/lib/useAppTheme';

type Props = {
  onClose: () => void;
  onSaved?: () => void;
};

export function AddTransactionForm({ onClose, onSaved }: Props) {
  const { refresh } = useApp();
  const errorStyle = useErrorStyle();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string | undefined>();
  const [fromAccountId, setFromAccountId] = useState<string | undefined>();
  const [toAccountId, setToAccountId] = useState<string | undefined>();
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [parentCategoryId, setParentCategoryId] = useState<string | undefined>();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [goalList, setGoalList] = useState<Goal[]>([]);
  const [goalId, setGoalId] = useState<string | undefined>();
  const [autoLinkedGoal, setAutoLinkedGoal] = useState<Goal | undefined>();
  const [saving, setSaving] = useState(false);

  const accountOptions = useMemo(
    () => accounts.map((a) => ({ value: a.id, label: a.name })),
    [accounts],
  );

  useEffect(() => {
    getActiveGoals().then(setGoalList);
  }, []);

  useEffect(() => {
    getAccounts().then((rows) => {
      setAccounts(rows);
      if (rows[0]) {
        setAccountId(rows[0].id);
        setFromAccountId(rows[0].id);
        setToAccountId(rows[1]?.id ?? rows[0].id);
      }
    });
  }, []);

  useEffect(() => {
    const catType = type === 'income' ? 'income' : 'expense';
    if (type === 'transfer') return;
    getParentCategories(catType).then((rows) => {
      setParentCategories(rows);
      setParentCategoryId(rows[0]?.id);
      setCategoryId(undefined);
    });
  }, [type]);

  useEffect(() => {
    if (!parentCategoryId || type === 'transfer') {
      setSubcategories([]);
      return;
    }
    getSubcategories(parentCategoryId).then((rows) => {
      setSubcategories(rows);
      setCategoryId(rows[0]?.id ?? parentCategoryId);
    });
  }, [parentCategoryId, type]);

  useEffect(() => {
    if (type === 'transfer' || !accountId) {
      setAutoLinkedGoal(undefined);
      return;
    }
    getActiveGoalByAccountId(accountId).then((goal) => {
      if (!goal || goal.type !== 'savings') {
        setAutoLinkedGoal(undefined);
        return;
      }
      setAutoLinkedGoal(goal);
      setGoalId(undefined);
    });
  }, [accountId, type]);

  const manualGoalOptions = useMemo(() => {
    if (autoLinkedGoal) return [];
    const filtered = goalList.filter((g) => {
      if (type === 'income') return g.type === 'savings';
      if (type === 'expense') return g.type === 'loan';
      return false;
    });
    return filtered.map((g) => ({
      value: g.id,
      label: `${g.name} (${g.type === 'loan' ? 'Loan' : 'Savings'})`,
    }));
  }, [goalList, type, autoLinkedGoal]);

  const handleSave = async () => {
    setError('');
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setError('Enter a positive amount');
      return;
    }

    if (type === 'transfer') {
      if (!fromAccountId || !toAccountId) {
        setError('Select both accounts');
        return;
      }
      if (fromAccountId === toAccountId) {
        setError('Accounts must be different');
        return;
      }
      setSaving(true);
      await createTransaction({
        type: 'transfer',
        amount: parsed,
        accountId: null,
        categoryId: null,
        fromAccountId,
        toAccountId,
        goalId: null,
        note: note.trim() || null,
        date: date.getTime(),
      });
    } else {
      if (!accountId) {
        setError('Select an account');
        return;
      }
      if (!categoryId) {
        setError('Select a category');
        return;
      }
      setSaving(true);
      await createTransaction({
        type,
        amount: parsed,
        accountId,
        categoryId,
        fromAccountId: null,
        toAccountId: null,
        goalId: goalId ?? null,
        note: note.trim() || null,
        date: date.getTime(),
      });
    }

    setSaving(false);
    refresh();
    onSaved?.();
    onClose();
  };

  return (
    <FormScreen
      title="Add transaction"
      onCancel={onClose}
      onConfirm={handleSave}
      confirmLoading={saving}
    >
      <TransactionTypeSelector value={type} onChange={setType} />

      <FormFieldGroup>
        <FormTextInput
          label="Amount"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          left={<TextInput.Affix text="$" />}
        />
        {type === 'transfer' ? (
          <>
            <InlineSelect
              label="From"
              value={fromAccountId}
              options={accountOptions}
              onChange={(v) => setFromAccountId(v)}
            />
            <InlineSelect
              label="To"
              value={toAccountId}
              options={accountOptions}
              onChange={(v) => setToAccountId(v)}
            />
          </>
        ) : (
          <>
            <InlineSelect
              label="Account"
              value={accountId}
              options={accountOptions}
              onChange={(v) => setAccountId(v)}
            />
            <InlineSelect
              label="Category"
              value={parentCategoryId}
              options={parentCategories.map((c) => ({ value: c.id, label: c.name }))}
              onChange={(v) => setParentCategoryId(v)}
            />
            {subcategories.length > 0 ? (
              <InlineSelect
                label="Subcategory"
                value={categoryId}
                options={subcategories.map((c) => ({ value: c.id, label: c.name }))}
                onChange={(v) => setCategoryId(v)}
              />
            ) : null}
          </>
        )}

        <FormFieldButton
          label="Date"
          value={date.toLocaleDateString()}
          onPress={() => setShowDatePicker(true)}
          icon="calendar-outline"
        />

        {type !== 'transfer' && autoLinkedGoal ? (
          <View>
            <Text variant="labelMedium" style={{ marginBottom: 4 }}>
              Goal
            </Text>
            <Text variant="bodyMedium">
              Tracking: {autoLinkedGoal.name} ({autoLinkedGoal.type === 'loan' ? 'Loan' : 'Savings'})
            </Text>
          </View>
        ) : null}

        {type !== 'transfer' && !autoLinkedGoal && manualGoalOptions.length > 0 ? (
          <InlineSelect
            label="Goal"
            value={goalId}
            options={manualGoalOptions}
            onChange={setGoalId}
            allowClear
          />
        ) : null}

        <FormTextInput label="Note (optional)" value={note} onChangeText={setNote} />
      </FormFieldGroup>

      {showDatePicker ? (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selected) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selected) setDate(selected);
          }}
        />
      ) : null}

      {error ? <Text style={errorStyle}>{error}</Text> : null}
    </FormScreen>
  );
}
