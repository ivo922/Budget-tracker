import type { Account, Category, Goal, Transaction } from '@/lib/db/schema';
import type { BackupFile } from './types';

const ACCOUNT_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EC4899', '#6750A4'];
const CATEGORY_COLORS = [
  '#E65100',
  '#1565C0',
  '#6A1B9A',
  '#00838F',
  '#C62828',
  '#AD1457',
  '#546E7A',
  '#2E7D32',
  '#558B2F',
  '#689F38',
];

const INCOME_CATEGORIES = new Set(['salary', 'investment', 'income', 'freelance']);

const HEADER_ALIASES: Record<string, keyof RowFields | '_ignore'> = {
  date: 'date',
  transactiondate: 'date',
  txndate: 'date',
  payee: 'note',
  payment: 'note',
  description: 'extraNote',
  memo: 'note',
  notes: 'note',
  note: 'note',
  title: 'note',
  merchant: 'note',
  amount: 'amount',
  value: 'amount',
  debit: 'debit',
  credit: 'credit',
  outflow: 'debit',
  inflow: 'credit',
  debitcredit: 'amount',
  category: 'category',
  subcategory: 'subcategory',
  cat: 'category',
  account: 'account',
  wallet: 'account',
  type: 'type',
  transactiontype: 'type',
  txn_type: 'type',
  paid: 'paid',
  ispaid: 'paid',
  status: 'paid',
  goal: 'goal',
  currency: '_ignore',
  balance: '_ignore',
  project: '_ignore',
  team: '_ignore',
  receipt: '_ignore',
  id: '_ignore',
  transactionid: '_ignore',
  createdat: '_ignore',
  paymentmethod: '_ignore',
  tags: '_ignore',
  accountbalance: '_ignore',
  availablebalance: '_ignore',
  creditlimit: '_ignore',
  issavings: '_ignore',
  requiredsum: '_ignore',
  requiredsumcurrency: '_ignore',
  accumulatedsum: '_ignore',
  accumulatedsumcurrency: '_ignore',
  plannedexpensedate: '_ignore',
  formatversion: '_ignore',
  period: '_ignore',
  userid: '_ignore',
};

type RowFields = {
  date: string;
  note: string;
  extraNote: string;
  amount: string;
  debit: string;
  credit: string;
  category: string;
  subcategory: string;
  account: string;
  type: string;
  paid: string;
  goal: string;
};

type ParsedRow = Partial<Record<keyof RowFields, string>>;

type ResolvedTxn = {
  type: Transaction['type'];
  amount: number;
  note: string | null;
  date: number;
  paid: boolean;
  categoryPath: string[];
  accountName: string | null;
  goalName: string | null;
  transferSide: 'out' | 'in' | null;
};

function normalizeHeader(header: string): keyof RowFields | '_ignore' | null {
  const key = header.trim().toLowerCase().replace(/[\s_-]+/g, '');
  return HEADER_ALIASES[key] ?? null;
}

/** ponytail: naive CSV — quoted fields only; fine for Budge exports */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
      row.push(field);
      field = '';
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      if (ch === '\r') i += 1;
    } else if (ch !== '\r') {
      field += ch;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  return rows;
}

function splitBudgeSections(csv: string): string[] {
  return csv
    .split(/^###\s*$/m)
    .map((section) => section.trim())
    .filter(Boolean);
}

function findSectionByFirstHeader(sections: string[], firstHeader: string): string[][] | null {
  for (const section of sections) {
    const table = parseCsv(section);
    if (table[0]?.[0]?.trim().toLowerCase() === firstHeader.toLowerCase()) return table;
  }
  return null;
}

function parseDateMs(raw: string): number | null {
  const value = raw.trim();
  if (!value) return null;
  if (/^\d{13}$/.test(value)) return Number(value);
  if (/^\d{10}$/.test(value)) return Number(value) * 1000;

  const dash = value.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dash) {
    const [, day, month, year] = dash;
    const ms = Date.parse(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    if (!Number.isNaN(ms)) return ms;
  }

  const iso = Date.parse(value);
  if (!Number.isNaN(iso)) return iso;

  const slash = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, a, b, year] = slash;
    const monthFirst = Date.parse(`${year}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`);
    if (!Number.isNaN(monthFirst)) return monthFirst;
    const dayFirst = Date.parse(`${year}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`);
    if (!Number.isNaN(dayFirst)) return dayFirst;
  }

  const compact = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) {
    const [, year, month, day] = compact;
    const ms = Date.parse(`${year}-${month}-${day}`);
    if (!Number.isNaN(ms)) return ms;
  }

  return null;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.trim().replace(/[,$\s]/g, '').replace(/^\((.*)\)$/, '-$1');
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? Math.abs(num) : null;
}

function parseSignedAmount(raw: string): number | null {
  const cleaned = raw.trim().replace(/[,$\s]/g, '').replace(/^\((.*)\)$/, '-$1');
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function parseType(raw: string): Transaction['type'] | null {
  const value = raw.trim().toLowerCase();
  if (!value) return null;
  if (value.includes('income') || value === 'in') return 'income';
  if (value.includes('expense') || value === 'out' || value === 'debit' || value === 'spend') {
    return 'expense';
  }
  if (value.includes('transfer')) return 'transfer';
  return null;
}

function parsePaid(raw: string): boolean {
  const value = raw.trim().toLowerCase();
  if (!value) return true;
  return !['false', '0', 'no', 'unpaid', 'pending'].includes(value);
}

function inferCategoryType(name: string, txnType: Transaction['type']): Category['type'] {
  if (txnType === 'income') return 'income';
  if (INCOME_CATEGORIES.has(name.trim().toLowerCase())) return 'income';
  return 'expense';
}

function categoryPathFromRow(row: ParsedRow): string[] {
  const parts: string[] = [];
  if (row.category) parts.push(...splitCategoryPath(row.category));
  if (row.subcategory?.trim()) {
    const sub = row.subcategory.trim();
    if (parts.length === 0 || parts[parts.length - 1].toLowerCase() !== sub.toLowerCase()) {
      parts.push(sub);
    }
  }
  return parts;
}

function splitCategoryPath(raw: string): string[] {
  return raw
    .split(/[>/|]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function combineNote(row: ParsedRow): string | null {
  const parts = [row.note?.trim(), row.extraNote?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(' — ') : null;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  throw new Error('crypto.randomUUID is required to convert Budge CSV');
}

function mapHeaders(headers: string[]): (keyof RowFields | '_ignore' | null)[] {
  return headers.map((header) => normalizeHeader(header));
}

function rowToFields(
  cells: string[],
  headerMap: (keyof RowFields | '_ignore' | null)[],
): ParsedRow {
  const row: ParsedRow = {};
  for (let i = 0; i < headerMap.length; i += 1) {
    const field = headerMap[i];
    if (!field || field === '_ignore') continue;
    const value = (cells[i] ?? '').trim();
    if (value) row[field] = value;
  }
  return row;
}

function resolveTransaction(row: ParsedRow): ResolvedTxn | null {
  const date = row.date ? parseDateMs(row.date) : null;
  if (date == null) return null;

  const categoryName = row.category?.trim() ?? '';
  const isTransfer = categoryName.toLowerCase() === 'transfer';
  const signedAmount = row.amount ? parseSignedAmount(row.amount) : null;
  const explicitType = row.type ? parseType(row.type) : null;
  const debit = row.debit ? parseAmount(row.debit) : null;
  const credit = row.credit ? parseAmount(row.credit) : null;
  const amountField = row.amount ? parseAmount(row.amount) : null;

  let type = explicitType;
  let amount: number | null = null;
  let transferSide: 'out' | 'in' | null = null;

  if (isTransfer || type === 'transfer') {
    type = 'transfer';
    amount = amountField ?? (signedAmount != null ? Math.abs(signedAmount) : null);
    if (signedAmount != null) transferSide = signedAmount < 0 ? 'out' : 'in';
    else if (row.note?.toLowerCase().includes('(out)')) transferSide = 'out';
    else if (row.note?.toLowerCase().includes('(in)')) transferSide = 'in';
  } else if (debit != null && debit > 0) {
    type = type ?? 'expense';
    amount = debit;
  } else if (credit != null && credit > 0) {
    type = type ?? 'income';
    amount = credit;
  } else if (amountField != null && signedAmount != null) {
    amount = amountField;
    if (signedAmount < 0) type = 'expense';
    else if (signedAmount > 0) {
      type = inferCategoryType(categoryName || row.category || '', 'expense') === 'income'
        ? 'income'
        : 'expense';
    }
    type = type ?? 'expense';
  }

  if (!type || amount == null || amount <= 0) return null;

  return {
    type,
    amount,
    note: combineNote(row),
    date,
    paid: row.paid ? parsePaid(row.paid) : true,
    categoryPath: isTransfer ? [] : categoryPathFromRow(row),
    accountName: row.account?.trim() || null,
    goalName: row.goal?.trim() || null,
    transferSide,
  };
}

function pairTransfers(rows: ResolvedTxn[]): Transaction[] {
  const transfers = rows.filter((row) => row.type === 'transfer');
  const paired = new Set<number>();
  const transactions: Transaction[] = [];
  const now = Date.now();

  for (let i = 0; i < transfers.length; i += 1) {
    if (paired.has(i)) continue;
    const out = transfers[i];
    if (out.transferSide !== 'out') continue;

    const matchIndex = transfers.findIndex(
      (candidate, index) =>
        !paired.has(index) &&
        index !== i &&
        candidate.transferSide === 'in' &&
        candidate.date === out.date &&
        candidate.amount === out.amount,
    );
    if (matchIndex < 0) continue;

    paired.add(i);
    paired.add(matchIndex);
    const incoming = transfers[matchIndex];
    transactions.push({
      id: newId(),
      type: 'transfer',
      amount: out.amount,
      accountId: null,
      categoryId: null,
      fromAccountId: null,
      toAccountId: null,
      goalId: null,
      note: out.note,
      date: out.date,
      paid: out.paid,
      createdAt: now,
      _fromName: out.accountName,
      _toName: incoming.accountName,
    } as Transaction & { _fromName: string | null; _toName: string | null });
  }

  return transactions;
}

function accountDelta(transactions: Transaction[], accountId: string): number {
  let delta = 0;
  for (const txn of transactions) {
    if (txn.type === 'income' && txn.accountId === accountId) delta += txn.amount;
    if (txn.type === 'expense' && txn.accountId === accountId) delta -= txn.amount;
    if (txn.type === 'transfer') {
      if (txn.fromAccountId === accountId) delta -= txn.amount;
      if (txn.toAccountId === accountId) delta += txn.amount;
    }
  }
  return delta;
}

function convertBudgeNativeExport(csv: string, exportedAt = new Date().toISOString()): BackupFile {
  const sections = splitBudgeSections(csv);
  const txnTable =
    findSectionByFirstHeader(sections, 'Date') ??
    (() => {
      throw new Error('Budge export missing transaction section');
    })();
  const accountTable = findSectionByFirstHeader(sections, 'Account');
  const goalTable = findSectionByFirstHeader(sections, 'Goal');

  const now = Date.now();
  const accountsByName = new Map<string, Account>();
  const categoriesByKey = new Map<string, Category>();
  const goalsByName = new Map<string, Goal>();
  let accountSort = 0;
  let categorySort = 0;
  let accountColor = 0;
  let categoryColor = 0;

  const ensureAccount = (name: string, balance?: number): Account => {
    const key = name.trim();
    let account = accountsByName.get(key);
    if (!account) {
      account = {
        id: newId(),
        name: key,
        color: ACCOUNT_COLORS[accountColor % ACCOUNT_COLORS.length],
        initialBalance: balance ?? 0,
        sortOrder: accountSort++,
        createdAt: now,
      };
      accountColor += 1;
      accountsByName.set(key, account);
    } else if (balance != null) {
      account.initialBalance = balance;
    }
    return account;
  };

  const ensureCategory = (path: string[], txnType: Transaction['type']): Category | null => {
    if (path.length === 0) return null;
    let parentId: string | null = null;
    let leaf: Category | null = null;

    for (const segment of path) {
      const type = inferCategoryType(segment, txnType);
      const key = `${type}:${parentId ?? 'root'}:${segment.toLowerCase()}`;
      let category = categoriesByKey.get(key);
      if (!category) {
        category = {
          id: newId(),
          name: segment,
          parentId,
          type,
          color: CATEGORY_COLORS[categoryColor % CATEGORY_COLORS.length],
          sortOrder: categorySort++,
        };
        categoryColor += 1;
        categoriesByKey.set(key, category);
      }
      parentId = category.id;
      leaf = category;
    }

    return leaf;
  };

  if (accountTable) {
    for (const cells of accountTable.slice(1)) {
      const name = cells[0]?.trim();
      if (!name) continue;
      const balance = parseAmount(cells[1] ?? '');
      ensureAccount(name, balance ?? undefined);
    }
  }

  if (goalTable) {
    for (const cells of goalTable.slice(1)) {
      const name = cells[0]?.trim();
      if (!name) continue;
      const targetAmount = parseAmount(cells[1] ?? '') ?? 0;
      const startingBalance = parseAmount(cells[3] ?? '') ?? 0;
      const targetDate = cells[5] ? parseDateMs(cells[5]) : null;
      const completed = startingBalance >= targetAmount && targetAmount > 0;
      const goal: Goal = {
        id: newId(),
        name,
        type: /credit|loan|debt/i.test(name) ? 'loan' : 'savings',
        targetAmount,
        startingBalance,
        targetDate,
        accountId: null,
        status: completed ? 'completed' : 'active',
        createdAt: now,
      };
      goalsByName.set(name, goal);
    }
  }

  const txnHeaders = mapHeaders(txnTable[0]);
  const resolvedRows: ResolvedTxn[] = [];
  for (const cells of txnTable.slice(1)) {
    const parsed = resolveTransaction(rowToFields(cells, txnHeaders));
    if (parsed && parsed.type !== 'transfer') resolvedRows.push(parsed);
    if (parsed?.type === 'transfer') resolvedRows.push(parsed);
  }

  const transferRows = resolvedRows.filter((row) => row.type === 'transfer');
  const regularRows = resolvedRows.filter((row) => row.type !== 'transfer');
  const rawTransfers = pairTransfers(transferRows);
  const transactions: Transaction[] = [];

  for (const parsed of regularRows) {
    const account = parsed.accountName ? ensureAccount(parsed.accountName) : ensureAccount('Imported');
    const category = ensureCategory(parsed.categoryPath, parsed.type);
    const goal = parsed.goalName ? goalsByName.get(parsed.goalName) : undefined;

    transactions.push({
      id: newId(),
      type: parsed.type,
      amount: parsed.amount,
      accountId: account.id,
      categoryId: category?.id ?? null,
      fromAccountId: null,
      toAccountId: null,
      goalId: goal?.id ?? null,
      note: parsed.note,
      date: parsed.date,
      paid: parsed.paid,
      createdAt: now,
    });
  }

  for (const raw of rawTransfers) {
    const fromName = (raw as Transaction & { _fromName?: string | null })._fromName;
    const toName = (raw as Transaction & { _toName?: string | null })._toName;
    const fromAccount = fromName ? ensureAccount(fromName) : null;
    const toAccount = toName ? ensureAccount(toName) : null;
    transactions.push({
      id: raw.id,
      type: 'transfer',
      amount: raw.amount,
      accountId: null,
      categoryId: null,
      fromAccountId: fromAccount?.id ?? null,
      toAccountId: toAccount?.id ?? null,
      goalId: null,
      note: raw.note,
      date: raw.date,
      paid: raw.paid,
      createdAt: raw.createdAt,
    });
  }

  if (transactions.length === 0) {
    throw new Error('No transactions could be parsed from Budge export');
  }

  if (accountTable) {
    for (const account of accountsByName.values()) {
      const reported = account.initialBalance;
      account.initialBalance = Math.round((reported - accountDelta(transactions, account.id)) * 100) / 100;
    }
  }

  transactions.sort((a, b) => a.date - b.date || a.createdAt - b.createdAt);

  return {
    version: 1,
    exportedAt,
    accounts: [...accountsByName.values()],
    categories: [...categoriesByKey.values()],
    goals: [...goalsByName.values()],
    transactions,
    budgets: [],
    settings: [],
  };
}

function convertSimpleBudgeCsv(csv: string, exportedAt = new Date().toISOString()): BackupFile {
  const table = parseCsv(csv.trim());
  if (table.length < 2) {
    throw new Error('Budge CSV must include a header row and at least one data row');
  }

  const headerMap = mapHeaders(table[0]);
  if (!headerMap.some((field) => field === 'date')) {
    throw new Error('Budge CSV must include a Date column');
  }

  const now = Date.now();
  const accountsByName = new Map<string, Account>();
  const categoriesByKey = new Map<string, Category>();
  const transactions: Transaction[] = [];
  let accountSort = 0;
  let categorySort = 0;
  let accountColor = 0;
  let categoryColor = 0;

  const ensureAccount = (name: string): Account => {
    const key = name.trim();
    const existing = accountsByName.get(key);
    if (existing) return existing;
    const account: Account = {
      id: newId(),
      name: key,
      color: ACCOUNT_COLORS[accountColor % ACCOUNT_COLORS.length],
      initialBalance: 0,
      sortOrder: accountSort++,
      createdAt: now,
    };
    accountColor += 1;
    accountsByName.set(key, account);
    return account;
  };

  const ensureCategory = (path: string[], txnType: Transaction['type']): Category | null => {
    if (path.length === 0) return null;
    let parentId: string | null = null;
    let leaf: Category | null = null;

    for (const segment of path) {
      const type = inferCategoryType(segment, txnType);
      const key = `${type}:${parentId ?? 'root'}:${segment.toLowerCase()}`;
      let category = categoriesByKey.get(key);
      if (!category) {
        category = {
          id: newId(),
          name: segment,
          parentId,
          type,
          color: CATEGORY_COLORS[categoryColor % CATEGORY_COLORS.length],
          sortOrder: categorySort++,
        };
        categoryColor += 1;
        categoriesByKey.set(key, category);
      }
      parentId = category.id;
      leaf = category;
    }

    return leaf;
  };

  for (const cells of table.slice(1)) {
    const parsed = resolveTransaction(rowToFields(cells, headerMap));
    if (!parsed || parsed.type === 'transfer') continue;

    const defaultAccount = accountsByName.size === 1 ? [...accountsByName.values()][0] : null;
    const account = parsed.accountName
      ? ensureAccount(parsed.accountName)
      : defaultAccount ?? ensureAccount('Imported');
    const category = ensureCategory(parsed.categoryPath, parsed.type);

    transactions.push({
      id: newId(),
      type: parsed.type,
      amount: parsed.amount,
      accountId: account.id,
      categoryId: category?.id ?? null,
      fromAccountId: null,
      toAccountId: null,
      goalId: null,
      note: parsed.note,
      date: parsed.date,
      paid: parsed.paid,
      createdAt: now,
    });
  }

  if (transactions.length === 0) {
    throw new Error('No transactions could be parsed from Budge CSV');
  }

  return {
    version: 1,
    exportedAt,
    accounts: [...accountsByName.values()],
    categories: [...categoriesByKey.values()],
    goals: [],
    transactions,
    budgets: [],
    settings: [],
  };
}

export function convertBudgeCsvToBackup(csv: string, exportedAt = new Date().toISOString()): BackupFile {
  if (csv.includes('###') && /Format version/i.test(csv)) {
    return convertBudgeNativeExport(csv, exportedAt);
  }
  return convertSimpleBudgeCsv(csv, exportedAt);
}
