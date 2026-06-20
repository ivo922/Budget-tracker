import { useEffect, useMemo, useState } from 'react';
import {
  defaultPaidForDate,
  getAccounts,
  getActiveGoalByAccountId,
  getActiveGoals,
  getParentCategories,
  getSubcategories,
} from '@/lib/db/queries';
import type { Account, Category, Goal, Transaction, TransactionType } from '@/lib/db/schema';
import { formatGoalType } from '@/lib/format';
import { parsePositiveAmount } from '@/lib/validate';

export type TransactionFormMode = 'add' | 'edit';

export type TransactionSavePayload =
  | {
      type: 'transfer';
      amount: number;
      fromAccountId: string;
      toAccountId: string;
      note: string | null;
      date: number;
      paid?: boolean;
      goalId?: string | null;
    }
  | {
      type: 'income' | 'expense';
      amount: number;
      accountId: string;
      categoryId: string;
      goalId: string | null;
      note: string | null;
      date: number;
      paid: boolean;
    };

type Options = {
  mode: TransactionFormMode;
  initialAccountId?: string;
  initialTx?: Transaction | null;
};

export function useTransactionForm({ mode, initialAccountId, initialTx }: Options) {
  const [type, setType] = useState<TransactionType>(initialTx?.type ?? 'expense');
  const [amount, setAmount] = useState(initialTx ? String(initialTx.amount) : '');
  const [note, setNote] = useState(initialTx?.note ?? '');
  const [date, setDate] = useState(initialTx ? new Date(initialTx.date) : new Date());
  const [paid, setPaid] = useState(initialTx?.paid ?? defaultPaidForDate(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string | undefined>(initialTx?.accountId ?? undefined);
  const [fromAccountId, setFromAccountId] = useState<string | undefined>(
    initialTx?.fromAccountId ?? undefined,
  );
  const [toAccountId, setToAccountId] = useState<string | undefined>(initialTx?.toAccountId ?? undefined);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [parentCategoryId, setParentCategoryId] = useState<string | undefined>();
  const [categoryId, setCategoryId] = useState<string | undefined>(initialTx?.categoryId ?? undefined);
  const [error, setError] = useState('');
  const [goalList, setGoalList] = useState<Goal[]>([]);
  const [goalId, setGoalId] = useState<string | undefined>(initialTx?.goalId ?? undefined);
  const [autoLinkedGoal, setAutoLinkedGoal] = useState<Goal | undefined>();

  const accountOptions = useMemo(
    () => accounts.map((a) => ({ value: a.id, label: a.name })),
    [accounts],
  );

  useEffect(() => {
    getActiveGoals().then(setGoalList);
  }, []);

  useEffect(() => {
    if (mode === 'edit' && initialTx) {
      getAccounts().then(setAccounts);
      return;
    }
    getAccounts().then((rows) => {
      setAccounts(rows);
      const defaultAccount = initialAccountId
        ? rows.find((a) => a.id === initialAccountId) ?? rows[0]
        : rows[0];
      if (defaultAccount) {
        setAccountId(defaultAccount.id);
        setFromAccountId(defaultAccount.id);
        const other = rows.find((a) => a.id !== defaultAccount.id);
        setToAccountId(other?.id ?? defaultAccount.id);
      }
    });
  }, [initialAccountId, initialTx, mode]);

  useEffect(() => {
    const catType = type === 'income' ? 'income' : 'expense';
    if (type === 'transfer') return;
    getParentCategories(catType).then((rows) => {
      setParentCategories(rows);
      if (mode === 'add') {
        setParentCategoryId(rows[0]?.id);
        setCategoryId(undefined);
      }
    });
  }, [mode, type]);

  useEffect(() => {
    if (mode !== 'edit' || !initialTx?.categoryId || type === 'transfer') return;
    (async () => {
      const catType = type === 'income' ? 'income' : 'expense';
      const allParents = await getParentCategories(catType);
      for (const p of allParents) {
        const subs = await getSubcategories(p.id);
        if (p.id === initialTx.categoryId) {
          setParentCategoryId(p.id);
          setSubcategories(subs);
          return;
        }
        if (subs.some((s) => s.id === initialTx.categoryId)) {
          setParentCategoryId(p.id);
          setSubcategories(subs);
          return;
        }
      }
    })();
  }, [initialTx?.categoryId, mode, type]);

  useEffect(() => {
    if (!parentCategoryId || type === 'transfer') {
      if (mode === 'add') setSubcategories([]);
      return;
    }
    getSubcategories(parentCategoryId).then((rows) => {
      setSubcategories(rows);
      if (mode === 'add') {
        setCategoryId(rows[0]?.id ?? parentCategoryId);
      } else if (rows.length === 0) {
        setCategoryId(parentCategoryId);
      }
    });
  }, [mode, parentCategoryId, type]);

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

  useEffect(() => {
    if (mode === 'add') setPaid(defaultPaidForDate(date));
  }, [date, mode]);

  const manualGoalOptions = useMemo(() => {
    if (autoLinkedGoal) return [];
    const filtered = goalList.filter((g) => {
      if (type === 'income') return g.type === 'savings';
      if (type === 'expense') return g.type === 'loan';
      return false;
    });
    return filtered.map((g) => ({
      value: g.id,
      label: `${g.name} (${formatGoalType(g.type)})`,
    }));
  }, [autoLinkedGoal, goalList, type]);

  const selectedLoanGoal = useMemo(
    () => goalList.find((g) => g.id === goalId && g.type === 'loan'),
    [goalId, goalList],
  );

  const buildPayload = (): { ok: true; payload: TransactionSavePayload } | { ok: false; error: string } => {
    setError('');
    const parsed = parsePositiveAmount(amount);
    if (parsed == null) {
      const message = 'Enter a positive amount';
      setError(message);
      return { ok: false, error: message };
    }

    if (type === 'transfer') {
      if (!fromAccountId || !toAccountId) {
        const message = mode === 'add' ? 'Select both accounts' : 'Select two different accounts';
        setError(message);
        return { ok: false, error: message };
      }
      if (fromAccountId === toAccountId) {
        const message = mode === 'add' ? 'Accounts must be different' : 'Select two different accounts';
        setError(message);
        return { ok: false, error: message };
      }
      return {
        ok: true,
        payload: {
          type: 'transfer',
          amount: parsed,
          fromAccountId,
          toAccountId,
          note: note.trim() || null,
          date: date.getTime(),
          ...(mode === 'edit' ? { paid, goalId: goalId ?? null } : {}),
        },
      };
    }

    if (!accountId) {
      const message = mode === 'add' ? 'Select an account' : 'Select account and category';
      setError(message);
      return { ok: false, error: message };
    }
    if (!categoryId) {
      const message = mode === 'add' ? 'Select a category' : 'Select account and category';
      setError(message);
      return { ok: false, error: message };
    }

    return {
      ok: true,
      payload: {
        type,
        amount: parsed,
        accountId,
        categoryId,
        goalId: goalId ?? null,
        note: note.trim() || null,
        date: date.getTime(),
        paid,
      },
    };
  };

  return {
    type,
    setType,
    amount,
    setAmount,
    note,
    setNote,
    date,
    setDate,
    paid,
    setPaid,
    showDatePicker,
    setShowDatePicker,
    accountOptions,
    accountId,
    setAccountId,
    fromAccountId,
    setFromAccountId,
    toAccountId,
    setToAccountId,
    parentCategories,
    subcategories,
    parentCategoryId,
    setParentCategoryId,
    categoryId,
    setCategoryId,
    goalId,
    setGoalId,
    autoLinkedGoal,
    manualGoalOptions,
    selectedLoanGoal,
    error,
    setError,
    buildPayload,
  };
}
