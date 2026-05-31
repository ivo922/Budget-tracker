import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Dialog,
  Menu,
  Portal,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';
import { EmptyState } from '@/components/EmptyState';
import { useApp } from '@/lib/context/AppContext';
import {
  deleteTransaction,
  getAccounts,
  getParentCategories,
  getSubcategories,
  getTransactionById,
  updateTransaction,
} from '@/lib/db/queries';
import type { Account, Category, Transaction, TransactionType } from '@/lib/db/schema';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { refresh } = useApp();
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
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <SegmentedButtons
          value={type}
          onValueChange={(v) => setType(v as TransactionType)}
          buttons={[
            { value: 'income', label: 'Income' },
            { value: 'expense', label: 'Expense' },
            { value: 'transfer', label: 'Transfer' },
          ]}
        />
        <TextInput label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" left={<TextInput.Affix text="$" />} />
        {type === 'transfer' ? (
          <>
            <Menu visible={fromMenu} onDismiss={() => setFromMenu(false)} anchor={<Button mode="outlined" onPress={() => setFromMenu(true)}>From: {accountName(fromAccountId)}</Button>}>
              {accounts.map((a) => <Menu.Item key={a.id} title={a.name} onPress={() => { setFromAccountId(a.id); setFromMenu(false); }} />)}
            </Menu>
            <Menu visible={toMenu} onDismiss={() => setToMenu(false)} anchor={<Button mode="outlined" onPress={() => setToMenu(true)}>To: {accountName(toAccountId)}</Button>}>
              {accounts.map((a) => <Menu.Item key={a.id} title={a.name} onPress={() => { setToAccountId(a.id); setToMenu(false); }} />)}
            </Menu>
          </>
        ) : (
          <>
            <Menu visible={accountMenu} onDismiss={() => setAccountMenu(false)} anchor={<Button mode="outlined" onPress={() => setAccountMenu(true)}>Account: {accountName(accountId)}</Button>}>
              {accounts.map((a) => <Menu.Item key={a.id} title={a.name} onPress={() => { setAccountId(a.id); setAccountMenu(false); }} />)}
            </Menu>
            <Menu visible={parentMenu} onDismiss={() => setParentMenu(false)} anchor={<Button mode="outlined" onPress={() => setParentMenu(true)}>Category: {parentCategories.find((c) => c.id === parentCategoryId)?.name ?? 'Select'}</Button>}>
              {parentCategories.map((c) => <Menu.Item key={c.id} title={c.name} onPress={() => { setParentCategoryId(c.id); setParentMenu(false); }} />)}
            </Menu>
            {subcategories.length > 0 && (
              <Menu visible={subMenu} onDismiss={() => setSubMenu(false)} anchor={<Button mode="outlined" onPress={() => setSubMenu(true)}>Subcategory: {subcategories.find((c) => c.id === categoryId)?.name ?? 'Select'}</Button>}>
                {subcategories.map((c) => <Menu.Item key={c.id} title={c.name} onPress={() => { setCategoryId(c.id); setSubMenu(false); }} />)}
              </Menu>
            )}
          </>
        )}
        <Button mode="outlined" onPress={() => setShowDatePicker(true)}>Date: {date.toLocaleDateString()}</Button>
        {showDatePicker && (
          <DateTimePicker value={date} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(_, s) => { setShowDatePicker(Platform.OS === 'ios'); if (s) setDate(s); }} />
        )}
        <TextInput label="Note" value={note} onChangeText={setNote} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.actions}>
          <Button mode="outlined" textColor="#C62828" onPress={() => setDeleteVisible(true)}>Delete</Button>
          <Button mode="contained" onPress={handleSave}>Save</Button>
        </View>
      </ScrollView>
      <Portal>
        <Dialog visible={deleteVisible} onDismiss={() => setDeleteVisible(false)}>
          <Dialog.Title>Delete transaction?</Dialog.Title>
          <Dialog.Content><Text>This action cannot be undone.</Text></Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteVisible(false)}>Cancel</Button>
            <Button textColor="#C62828" onPress={handleDelete}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#C62828' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
});
