import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text, TextInput } from 'react-native-paper';
import { FormFieldButton } from '@/components/FormFieldButton';
import { FormFieldGroup } from '@/components/FormFieldGroup';
import { FormFieldSwitch } from '@/components/FormFieldSwitch';
import { FormHelperText } from '@/components/FormHelperText';
import { FormScreen } from '@/components/FormScreen';
import { FormSection } from '@/components/FormSection';
import { FormTextInput } from '@/components/FormTextInput';
import { InlineSelect } from '@/components/InlineSelect';
import { EmptyState } from '@/components/EmptyState';
import { TransactionTypeSelector } from '@/components/TransactionTypeSelector';
import { useApp } from '@/lib/context/AppContext';
import {
  getAccounts,
  getActiveGoalByAccountId,
  getActiveGoals,
  getParentCategories,
  getSubcategories,
  getTransactionById,
  updateTransaction,
} from '@/lib/db/queries';
import type { Account, Category, Goal, Transaction, TransactionType } from '@/lib/db/schema';
import { layoutStyles } from '@/lib/layout';
import { navigateToConfirm } from '@/lib/navigateConfirm';
import { useErrorStyle, useAppTheme } from '@/lib/useAppTheme';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { refresh } = useApp();
  const theme = useAppTheme();
  const errorStyle = useErrorStyle();
  const [loading, setLoading] = useState(true);
  const [original, setOriginal] = useState<Transaction | null>(null);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [paid, setPaid] = useState(true);
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
    if (!id) return;
    (async () => {
      const [tx, accts] = await Promise.all([getTransactionById(id), getAccounts()]);
      setAccounts(accts);
      if (!tx) {
        setLoading(false);
        return;
      }
      setOriginal(tx);
      setType(tx.type);
      setAmount(String(tx.amount));
      setNote(tx.note ?? '');
      setDate(new Date(tx.date));
      setPaid(tx.paid);
      setAccountId(tx.accountId ?? undefined);
      setFromAccountId(tx.fromAccountId ?? undefined);
      setToAccountId(tx.toAccountId ?? undefined);
      setCategoryId(tx.categoryId ?? undefined);
      setGoalId(tx.goalId ?? undefined);
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (type === 'transfer') return;
    const catType = type === 'income' ? 'income' : 'expense';
    getParentCategories(catType).then(setParentCategories);
  }, [type]);

  useEffect(() => {
    if (!categoryId || type === 'transfer') return;
    (async () => {
      const allParents = await getParentCategories(type === 'income' ? 'income' : 'expense');
      for (const p of allParents) {
        const subs = await getSubcategories(p.id);
        if (p.id === categoryId) {
          setParentCategoryId(p.id);
          setSubcategories(subs);
          return;
        }
        if (subs.some((s) => s.id === categoryId)) {
          setParentCategoryId(p.id);
          setSubcategories(subs);
          return;
        }
      }
    })();
  }, [categoryId, type]);

  useEffect(() => {
    if (!parentCategoryId || type === 'transfer') return;
    getSubcategories(parentCategoryId).then((rows) => {
      setSubcategories(rows);
      if (rows.length === 0) setCategoryId(parentCategoryId);
    });
  }, [parentCategoryId, type]);

  useEffect(() => {
    if (type === 'transfer') {
      if (!toAccountId && !fromAccountId) {
        setAutoLinkedGoal(undefined);
        return;
      }
      Promise.all([
        toAccountId ? getActiveGoalByAccountId(toAccountId) : undefined,
        fromAccountId ? getActiveGoalByAccountId(fromAccountId) : undefined,
      ]).then(([toGoal, fromGoal]) => {
        const goal =
          toGoal?.type === 'savings' ? toGoal : fromGoal?.type === 'savings' ? fromGoal : undefined;
        setAutoLinkedGoal(goal);
        if (goal) setGoalId(undefined);
      });
      return;
    }
    if (!accountId) {
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
  }, [accountId, fromAccountId, toAccountId, type]);

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

  const selectedLoanGoal = useMemo(
    () => goalList.find((g) => g.id === goalId && g.type === 'loan'),
    [goalId, goalList],
  );

  const handleSave = async () => {
    if (!id) return;
    setError('');
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setError('Enter a positive amount');
      return;
    }

    setSaving(true);
    if (type === 'transfer') {
      if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
        setError('Select two different accounts');
        setSaving(false);
        return;
      }
      await updateTransaction(id, {
        type: 'transfer',
        amount: parsed,
        accountId: null,
        categoryId: null,
        fromAccountId,
        toAccountId,
        goalId: goalId ?? null,
        note: note.trim() || null,
        date: date.getTime(),
        paid,
      });
    } else {
      if (!accountId || !categoryId) {
        setError('Select account and category');
        setSaving(false);
        return;
      }
      await updateTransaction(id, {
        type,
        amount: parsed,
        accountId,
        categoryId,
        fromAccountId: null,
        toAccountId: null,
        goalId: goalId ?? null,
        note: note.trim() || null,
        date: date.getTime(),
        paid,
      });
    }
    setSaving(false);
    refresh();
    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    navigateToConfirm(router, {
      type: 'transaction',
      id,
      title: 'Delete transaction?',
      message: 'This action cannot be undone.',
      dismiss: 2,
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!original) {
    return <EmptyState title="Not found" message="This transaction no longer exists." />;
  }

  return (
    <FormScreen
      title="Edit transaction"
      onCancel={() => router.back()}
      onConfirm={handleSave}
      confirmLoading={saving}
      onSecondary={handleDelete}
      secondaryLabel="Delete"
      secondaryDestructive
    >
      <FormSection compact>
        <TransactionTypeSelector value={type} onChange={setType} />
      </FormSection>
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
              onChange={setFromAccountId}
            />
            <InlineSelect
              label="To"
              value={toAccountId}
              options={accountOptions}
              onChange={setToAccountId}
            />
          </>
        ) : (
          <>
            <InlineSelect
              label="Account"
              value={accountId}
              options={accountOptions}
              onChange={setAccountId}
            />
            <InlineSelect
              label="Category"
              value={parentCategoryId}
              options={parentCategories.map((c) => ({ value: c.id, label: c.name }))}
              onChange={setParentCategoryId}
            />
            {subcategories.length > 0 ? (
              <InlineSelect
                label="Subcategory"
                value={categoryId}
                options={subcategories.map((c) => ({ value: c.id, label: c.name }))}
                onChange={setCategoryId}
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

        {type !== 'transfer' ? (
          <FormFieldSwitch label="Paid" value={paid} onValueChange={setPaid} />
        ) : null}

        {autoLinkedGoal ? (
          <View style={layoutStyles.formField}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Goal
            </Text>
            <Text variant="bodyMedium">
              Tracking: {autoLinkedGoal.name} (
              {autoLinkedGoal.type === 'loan' ? 'Loan' : 'Savings'})
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

        {type === 'expense' && selectedLoanGoal ? (
          <FormHelperText>Each linked expense counts toward loan payoff.</FormHelperText>
        ) : null}

        {type === 'expense' && !goalId && !autoLinkedGoal && manualGoalOptions.length > 0 ? (
          <FormHelperText>Track toward a loan? Pick a goal above.</FormHelperText>
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

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
