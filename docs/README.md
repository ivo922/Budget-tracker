# Budget Tracker — Documentation

## Project overview

Budget Tracker is a **local-first** Expo mobile app. All data lives on device in SQLite. There is no authentication, backend, or cloud sync in v1.

Users can:

- Create accounts and track balances
- Record income, expenses, and transfers
- Organize spending with hierarchical categories
- View summaries and charts by time period (day, week, month, year)

---

## Tool & dependency reference

| Tool / package | Responsibility |
|----------------|----------------|
| **Expo SDK** | React Native runtime, dev server, native modules, build tooling |
| **Expo Router** | File-based navigation under `app/` (tabs, modals, dynamic routes) |
| **expo-sqlite** | On-device SQLite database |
| **Drizzle ORM** | Type-safe schema (`lib/db/schema.ts`) and query builder |
| **drizzle-kit** | Migration generation (`npm run db:generate`) |
| **date-fns** | Period boundaries in `lib/periods.ts` |
| **expo-crypto** | UUID generation for primary keys |
| **React Native Paper** | Material Design 3 UI — cards, FAB, dialogs, lists, inputs, theming |
| **react-native-safe-area-context** | Safe area insets (via Expo / navigation) |
| **react-native-gifted-charts** | Bar charts on Analytics screen |
| **@react-native-community/datetimepicker** | Date picker on transaction forms |
| **TypeScript** | Static typing across the codebase |

---

## Code ownership map

| Path | Responsibility |
|------|----------------|
| `app/` | Screens and navigation; minimal business logic |
| `app/(tabs)/` | Main tab screens: Dashboard, Accounts, Transactions, Analytics |
| `app/transaction/` | Add and edit transaction modals |
| `app/account/[id].tsx` | Single-account detail and transaction list |
| `app/categories/index.tsx` | Category and subcategory management |
| `lib/db/schema.ts` | Table definitions: accounts, categories, transactions, goals |
| `lib/db/index.ts` | DB open, migration SQL, singleton |
| `lib/db/queries.ts` | CRUD, balances, period aggregates, goal stubs |
| `lib/db/seed.ts` | Default category tree on first launch |
| `lib/db/migrations/init.ts` | Initial CREATE TABLE statements |
| `lib/periods.ts` | Period enum → `{ start, end, label }` |
| `lib/format.ts` | Currency and date formatting |
| `lib/theme.ts` | React Native Paper light/dark themes |
| `lib/context/AppContext.tsx` | DB init gate, period state, refresh trigger |
| `components/` | Reusable UI: PeriodSelector, BalanceCard, TransactionRow, SpendingChart, EmptyState |

---

## Architecture

### Data model

```
accounts ──< transactions
categories (self-referential parent_id) ──< transactions
goals ──< transactions.goal_id (nullable, v2 UI)
```

**Account balance** (computed):

```
initial_balance
+ SUM(income on account)
+ SUM(transfers in)
- SUM(expenses on account)
- SUM(transfers out)
```

**Transaction rules:**

| Type | Fields |
|------|--------|
| Income / expense | `account_id`, `category_id`, `amount`, `date`, `note` |
| Transfer | `from_account_id`, `to_account_id`, `amount`, `date`, `note` |

Transfers are excluded from income/expense totals on the dashboard and analytics.

### Folder structure

```
app/
  (tabs)/index.tsx       Dashboard
  (tabs)/accounts.tsx    Account list
  (tabs)/transactions.tsx Transaction feed
  (tabs)/analytics.tsx   Charts
  account/[id].tsx
  transaction/add.tsx
  transaction/[id].tsx
  categories/index.tsx
lib/db/
components/
docs/
```

### Query layer conventions

- All DB access goes through `lib/db/queries.ts`
- Screens call query functions; they do not write raw SQL
- `useApp().refresh()` bumps a key so focused screens reload after mutations

---

## Implementation plan

### Stack

| Layer | Choice |
|-------|--------|
| Framework | Expo SDK 52 + Expo Router |
| Storage | expo-sqlite + Drizzle ORM |
| UI | React Native Paper (Material Design 3) |
| Dates | date-fns |
| Charts | react-native-gifted-charts |

### Default seed categories

**Expense:** Food (Groceries, Restaurants), Housing (Rent, Utilities), Entertainment (Going out, Streaming), Transport (Fuel, Public transit), Health, Shopping, Other

**Income:** Salary (Paycheck), Freelance, Other

### Implementation order (completed in v1)

1. Docs + DB layer (schema, goals table, `goal_id`, seed, queries)
2. Accounts tab
3. Transaction form (income, expense, transfer)
4. Transactions feed with filters
5. Dashboard with period selector
6. Analytics with category drill-down
7. Category management
8. Polish: empty states, delete guards, formatting

### Out of scope (v1 UI)

- Goals / loans / savings screens and transaction linking picker
- Multi-currency
- Cloud sync, backup, auth
- Recurring transactions / budget limits
- Receipt photos, bank import
- Widgets / notifications
- Loan interest / amortization

---

## Future roadmap: loans & savings goals

Schema is ready in v1; UI ships in v2.

### `goals` table

| Column | Purpose |
|--------|---------|
| `type` | `loan` or `savings` |
| `name` | e.g. "Car loan", "Vacation fund" |
| `target_amount` | Loan principal or savings target |
| `starting_balance` | Already paid off / already saved at creation |
| `target_date` | Optional deadline |
| `account_id` | Optional linked account |
| `status` | `active`, `completed`, `archived` |

### Transaction linking (v2)

Nullable `transactions.goal_id`:

- **Loan payment:** expense or transfer linked to loan → counts toward payoff
- **Savings deposit:** income or transfer linked to savings → counts toward target

**Progress** (computed):

```
starting_balance + SUM(linked transaction amounts)
```

Linked transactions still affect account balances normally; the goal link is progress tracking only.

### v2 UI (planned)

- Goals tab with progress bars
- Goal picker on transaction form
- Auto-complete when progress ≥ target
- Loan extras: interest rate, amortization (later)

Stub query helpers already exist: `getGoals()`, `getGoalProgress(goalId)`.

---

## Verification checklist

- [ ] Create 2 accounts with starting balances
- [ ] Add income, expense, transfer; verify balances
- [ ] Confirm transfers do not inflate income/expense totals
- [ ] Switch periods on dashboard/analytics
- [ ] Add custom subcategory; assign to transaction; see in analytics
- [ ] Delete transaction; balances update
- [ ] Attempt delete category with transactions (blocked)

---

## Commands

```bash
npm start          # Expo dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run db:generate  # Generate Drizzle migrations from schema changes
```
