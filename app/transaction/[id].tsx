import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ActivityIndicator, Button, Text, TextInput } from 'react-native-paper';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { FormFieldButton } from '@/components/FormFieldButton';
import { FormFieldGroup } from '@/components/FormFieldGroup';
import { InlineSelect } from '@/components/InlineSelect';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
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
import { layoutStyles, SCREEN_PADDING } from '@/lib/layout';
import { navigateToConfirm } from '@/lib/navigateConfirm';
import { useErrorStyle, useAppTheme } from '@/lib/useAppTheme';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { refresh } = useApp();
  const theme = useAppTheme();
  const errorStyle = useErrorStyle();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyleNoFab } = useCollapsibleHeader();
  const [loading, setLoading] = useState(true);
  const [original, setOriginal] = useState<Transaction | null>(null);
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
    <View style={layoutStyles.screen}>
      <CollapsibleScreenHeader
        title="Edit transaction"
        scrollY={scrollY}
        headerHeight={headerHeight}
        leftAction="back"
        onLeftPress={() => router.back()}
      />
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[scrollContentStyleNoFab, styles.content]}
        keyboardShouldPersistTaps="handled"
      >
        <TransactionTypeSelector value={type} onChange={setType} />
        <FormFieldGroup>
          <TextInput
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

          {type !== 'transfer' && autoLinkedGoal ? (
            <View style={styles.goalBlock}>
              <Text variant="labelMedium">Goal</Text>
              <Text variant="bodyMedium">
                Tracking: {autoLinkedGoal.name} (
                {autoLinkedGoal.type === 'loan' ? 'Loan' : 'Savings'})
              </Text>
            </View>
          ) : null}

          {type === 'transfer' && autoLinkedGoal ? (
            <View style={styles.goalBlock}>
              <Text variant="labelMedium">Goal</Text>
              <Text variant="bodyMedium">Tracking: {autoLinkedGoal.name} (Savings)</Text>
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
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, paddingHorizontal: 14 }}>
              Each linked expense counts toward loan payoff.
            </Text>
          ) : null}

          {type === 'expense' && !goalId && !autoLinkedGoal && manualGoalOptions.length > 0 ? (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, paddingHorizontal: 14 }}>
              Track toward a loan? Pick a goal above.
            </Text>
          ) : null}

          <TextInput label="Note (optional)" value={note} onChangeText={setNote} />
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
        <View style={styles.actions}>
          <Button mode="outlined" textColor={theme.colors.error} onPress={handleDelete}>
            Delete
          </Button>
          <Button mode="contained" onPress={handleSave} loading={saving}>
            Save
          </Button>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: SCREEN_PADDING },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  goalBlock: { paddingHorizontal: 14, gap: 4 },
});
