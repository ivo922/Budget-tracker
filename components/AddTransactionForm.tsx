import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { ThemedMenu, ThemedMenuItem } from '@/components/ThemedMenu';
import { TransactionTypeSelector } from '@/components/TransactionTypeSelector';
import { useApp } from '@/lib/context/AppContext';
import {
  createTransaction,
  getAccounts,
  getParentCategories,
  getSubcategories,
} from '@/lib/db/queries';
import type { Account, Category, TransactionType } from '@/lib/db/schema';
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
    onSaved?.();
    onClose();
  };

  const accountName = (id?: string) => accounts.find((a) => a.id === id)?.name ?? 'Select';

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text variant="titleMedium" style={styles.heading}>
        Add transaction
      </Text>

      <TransactionTypeSelector value={type} onChange={setType} />

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
          <ThemedMenu
            visible={fromMenu}
            onDismiss={() => setFromMenu(false)}
            anchor={<Button mode="outlined" onPress={() => setFromMenu(true)}>From: {accountName(fromAccountId)}</Button>}
          >
            {accounts.map((a) => (
              <ThemedMenuItem key={a.id} title={a.name} onPress={() => { setFromAccountId(a.id); setFromMenu(false); }} />
            ))}
          </ThemedMenu>
          <ThemedMenu
            visible={toMenu}
            onDismiss={() => setToMenu(false)}
            anchor={<Button mode="outlined" onPress={() => setToMenu(true)}>To: {accountName(toAccountId)}</Button>}
          >
            {accounts.map((a) => (
              <ThemedMenuItem key={a.id} title={a.name} onPress={() => { setToAccountId(a.id); setToMenu(false); }} />
            ))}
          </ThemedMenu>
        </>
      ) : (
        <>
          <ThemedMenu
            visible={accountMenu}
            onDismiss={() => setAccountMenu(false)}
            anchor={<Button mode="outlined" onPress={() => setAccountMenu(true)}>Account: {accountName(accountId)}</Button>}
          >
            {accounts.map((a) => (
              <ThemedMenuItem key={a.id} title={a.name} onPress={() => { setAccountId(a.id); setAccountMenu(false); }} />
            ))}
          </ThemedMenu>
          <ThemedMenu
            visible={parentMenu}
            onDismiss={() => setParentMenu(false)}
            anchor={
              <Button mode="outlined" onPress={() => setParentMenu(true)}>
                Category: {parentCategories.find((c) => c.id === parentCategoryId)?.name ?? 'Select'}
              </Button>
            }
          >
            {parentCategories.map((c) => (
              <ThemedMenuItem key={c.id} title={c.name} onPress={() => { setParentCategoryId(c.id); setParentMenu(false); }} />
            ))}
          </ThemedMenu>
          {subcategories.length > 0 && (
            <ThemedMenu
              visible={subMenu}
              onDismiss={() => setSubMenu(false)}
              anchor={
                <Button mode="outlined" onPress={() => setSubMenu(true)}>
                  Subcategory: {subcategories.find((c) => c.id === categoryId)?.name ?? 'Select'}
                </Button>
              }
            >
              {subcategories.map((c) => (
                <ThemedMenuItem key={c.id} title={c.name} onPress={() => { setCategoryId(c.id); setSubMenu(false); }} />
              ))}
            </ThemedMenu>
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

      {error ? <Text style={errorStyle}>{error}</Text> : null}

      <View style={styles.actions}>
        <Button mode="outlined" onPress={onClose}>Cancel</Button>
        <Button mode="contained" onPress={handleSave}>Save</Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  heading: { fontWeight: '600' },
  input: { marginTop: 4 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
});
