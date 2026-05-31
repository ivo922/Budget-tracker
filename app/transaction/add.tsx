import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Menu,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';
import { useApp } from '@/lib/context/AppContext';
import {
  createTransaction,
  getAccounts,
  getParentCategories,
  getSubcategories,
} from '@/lib/db/queries';
import type { Account, Category, TransactionType } from '@/lib/db/schema';

export default function AddTransactionScreen() {
  const router = useRouter();
  const { refresh } = useApp();
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
  const [accountMenu, setAccountMenu] = useState(false);
  const [fromMenu, setFromMenu] = useState(false);
  const [toMenu, setToMenu] = useState(false);
  const [parentMenu, setParentMenu] = useState(false);
  const [subMenu, setSubMenu] = useState(false);

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
      await createTransaction({
        type,
        amount: parsed,
        accountId,
        categoryId,
        fromAccountId: null,
        toAccountId: null,
        goalId: null,
        note: note.trim() || null,
        date: date.getTime(),
      });
    }

    refresh();
    router.back();
  };

  const accountName = (id?: string) => accounts.find((a) => a.id === id)?.name ?? 'Select';

  return (
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

      <TextInput
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        style={styles.input}
        left={<TextInput.Affix text="$" />}
      />

      {type === 'transfer' ? (
        <>
          <Menu
            visible={fromMenu}
            onDismiss={() => setFromMenu(false)}
            anchor={<Button mode="outlined" onPress={() => setFromMenu(true)}>From: {accountName(fromAccountId)}</Button>}
          >
            {accounts.map((a) => (
              <Menu.Item key={a.id} title={a.name} onPress={() => { setFromAccountId(a.id); setFromMenu(false); }} />
            ))}
          </Menu>
          <Menu
            visible={toMenu}
            onDismiss={() => setToMenu(false)}
            anchor={<Button mode="outlined" onPress={() => setToMenu(true)}>To: {accountName(toAccountId)}</Button>}
          >
            {accounts.map((a) => (
              <Menu.Item key={a.id} title={a.name} onPress={() => { setToAccountId(a.id); setToMenu(false); }} />
            ))}
          </Menu>
        </>
      ) : (
        <>
          <Menu
            visible={accountMenu}
            onDismiss={() => setAccountMenu(false)}
            anchor={<Button mode="outlined" onPress={() => setAccountMenu(true)}>Account: {accountName(accountId)}</Button>}
          >
            {accounts.map((a) => (
              <Menu.Item key={a.id} title={a.name} onPress={() => { setAccountId(a.id); setAccountMenu(false); }} />
            ))}
          </Menu>
          <Menu
            visible={parentMenu}
            onDismiss={() => setParentMenu(false)}
            anchor={
              <Button mode="outlined" onPress={() => setParentMenu(true)}>
                Category: {parentCategories.find((c) => c.id === parentCategoryId)?.name ?? 'Select'}
              </Button>
            }
          >
            {parentCategories.map((c) => (
              <Menu.Item key={c.id} title={c.name} onPress={() => { setParentCategoryId(c.id); setParentMenu(false); }} />
            ))}
          </Menu>
          {subcategories.length > 0 && (
            <Menu
              visible={subMenu}
              onDismiss={() => setSubMenu(false)}
              anchor={
                <Button mode="outlined" onPress={() => setSubMenu(true)}>
                  Subcategory: {subcategories.find((c) => c.id === categoryId)?.name ?? 'Select'}
                </Button>
              }
            >
              {subcategories.map((c) => (
                <Menu.Item key={c.id} title={c.name} onPress={() => { setCategoryId(c.id); setSubMenu(false); }} />
              ))}
            </Menu>
          )}
        </>
      )}

      <Button mode="outlined" onPress={() => setShowDatePicker(true)}>
        Date: {date.toLocaleDateString()}
      </Button>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selected) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selected) setDate(selected);
          }}
        />
      )}

      <TextInput label="Note (optional)" value={note} onChangeText={setNote} style={styles.input} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <Button mode="outlined" onPress={() => router.back()}>Cancel</Button>
        <Button mode="contained" onPress={handleSave}>Save</Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  input: { marginTop: 4 },
  error: { color: '#C62828' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
});
