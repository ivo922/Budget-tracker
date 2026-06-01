import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import {
  ActivityIndicator,
  Button,
  Text,
  TextInput,
} from 'react-native-paper';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { ConfirmPopup } from '@/components/ConfirmPopup';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import { layoutStyles, SCREEN_PADDING } from '@/lib/layout';
import { ThemedMenu, ThemedMenuItem } from '@/components/ThemedMenu';
import { useErrorStyle, useAppTheme } from '@/lib/useAppTheme';
import { EmptyState } from '@/components/EmptyState';
import { TransactionTypeSelector } from '@/components/TransactionTypeSelector';
import { useApp } from '@/lib/context/AppContext';
import {
  deleteTransaction,
  getAccounts,
  getActiveGoals,
  getParentCategories,
  getSubcategories,
  getTransactionById,
  updateTransaction,
} from '@/lib/db/queries';
import type { Account, Category, Goal, Transaction, TransactionType } from '@/lib/db/schema';

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
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [accountMenu, setAccountMenu] = useState(false);
  const [fromMenu, setFromMenu] = useState(false);
  const [toMenu, setToMenu] = useState(false);
  const [parentMenu, setParentMenu] = useState(false);
  const [subMenu, setSubMenu] = useState(false);
  const [goalList, setGoalList] = useState<Goal[]>([]);
  const [goalId, setGoalId] = useState<string | undefined>();
  const [goalMenu, setGoalMenu] = useState(false);

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

  const handleSave = async () => {
    if (!id) return;
    setError('');
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setError('Enter a positive amount');
      return;
    }

    if (type === 'transfer') {
      if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
        setError('Select two different accounts');
        return;
      }
      await updateTransaction(id, {
        type: 'transfer',
        amount: parsed,
        accountId: null,
        categoryId: null,
        fromAccountId,
        toAccountId,
        note: note.trim() || null,
        date: date.getTime(),
      });
    } else {
      if (!accountId || !categoryId) {
        setError('Select account and category');
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
    refresh();
    router.back();
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteTransaction(id);
    refresh();
    setDeleteVisible(false);
    router.back();
  };

  const accountName = (aid?: string) => accounts.find((a) => a.id === aid)?.name ?? 'Select';

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
      >
        <TransactionTypeSelector value={type} onChange={setType} />
        <TextInput label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" left={<TextInput.Affix text="$" />} />
        {type === 'transfer' ? (
          <>
            <ThemedMenu visible={fromMenu} onDismiss={() => setFromMenu(false)} anchor={<Button mode="outlined" onPress={() => setFromMenu(true)}>From: {accountName(fromAccountId)}</Button>}>
              {accounts.map((a) => <ThemedMenuItem key={a.id} title={a.name} onPress={() => { setFromAccountId(a.id); setFromMenu(false); }} />)}
            </ThemedMenu>
            <ThemedMenu visible={toMenu} onDismiss={() => setToMenu(false)} anchor={<Button mode="outlined" onPress={() => setToMenu(true)}>To: {accountName(toAccountId)}</Button>}>
              {accounts.map((a) => <ThemedMenuItem key={a.id} title={a.name} onPress={() => { setToAccountId(a.id); setToMenu(false); }} />)}
            </ThemedMenu>
          </>
        ) : (
          <>
            <ThemedMenu visible={accountMenu} onDismiss={() => setAccountMenu(false)} anchor={<Button mode="outlined" onPress={() => setAccountMenu(true)}>Account: {accountName(accountId)}</Button>}>
              {accounts.map((a) => <ThemedMenuItem key={a.id} title={a.name} onPress={() => { setAccountId(a.id); setAccountMenu(false); }} />)}
            </ThemedMenu>
            <ThemedMenu visible={parentMenu} onDismiss={() => setParentMenu(false)} anchor={<Button mode="outlined" onPress={() => setParentMenu(true)}>Category: {parentCategories.find((c) => c.id === parentCategoryId)?.name ?? 'Select'}</Button>}>
              {parentCategories.map((c) => <ThemedMenuItem key={c.id} title={c.name} onPress={() => { setParentCategoryId(c.id); setParentMenu(false); }} />)}
            </ThemedMenu>
            {subcategories.length > 0 && (
              <ThemedMenu visible={subMenu} onDismiss={() => setSubMenu(false)} anchor={<Button mode="outlined" onPress={() => setSubMenu(true)}>Subcategory: {subcategories.find((c) => c.id === categoryId)?.name ?? 'Select'}</Button>}>
                {subcategories.map((c) => <ThemedMenuItem key={c.id} title={c.name} onPress={() => { setCategoryId(c.id); setSubMenu(false); }} />)}
              </ThemedMenu>
            )}
          </>
        )}
        <Button mode="outlined" onPress={() => setShowDatePicker(true)}>Date: {date.toLocaleDateString()}</Button>
        {showDatePicker && (
          <DateTimePicker value={date} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_, s) => { setShowDatePicker(Platform.OS === 'ios'); if (s) setDate(s); }} />
        )}
        {type !== 'transfer' && goalList.length > 0 ? (
          <ThemedMenu
            visible={goalMenu}
            onDismiss={() => setGoalMenu(false)}
            anchor={
              <Button mode="outlined" onPress={() => setGoalMenu(true)}>
                Goal: {goalList.find((g) => g.id === goalId)?.name ?? 'None'}
              </Button>
            }
          >
            <ThemedMenuItem title="None" onPress={() => { setGoalId(undefined); setGoalMenu(false); }} />
            {goalList.map((g) => (
              <ThemedMenuItem key={g.id} title={g.name} onPress={() => { setGoalId(g.id); setGoalMenu(false); }} />
            ))}
          </ThemedMenu>
        ) : null}
        <TextInput label="Note" value={note} onChangeText={setNote} />
        {error ? <Text style={errorStyle}>{error}</Text> : null}
        <View style={styles.actions}>
          <Button mode="outlined" textColor={theme.colors.error} onPress={() => setDeleteVisible(true)}>Delete</Button>
          <Button mode="contained" onPress={handleSave}>Save</Button>
        </View>
      </Animated.ScrollView>
      <ConfirmPopup
        visible={deleteVisible}
        onClose={() => setDeleteVisible(false)}
        title="Delete transaction?"
        message="This action cannot be undone."
        onConfirm={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: SCREEN_PADDING },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
});
