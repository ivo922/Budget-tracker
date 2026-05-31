# Budget Tracker — TODO

Last updated: 2026-05-31

---

## Prior session summary

Source: [First polish session](53afcba3-fb28-4a48-b458-862e8da5a7f8) (agent transcript, first pass on `main`).

### What that session did

1. **Run / fix** — Installed `expo-linear-gradient` for `react-native-gifted-charts`. Web LogBox “state update before mount” traced to SQLite missing on web → platform DB split (`lib/db/index.native.ts` / `index.web.ts`) and Expo Go messaging.
2. **Expo SDK** — Upgraded **52 → 54** stepwise for Expo Go compatibility.
3. **Color system** — Semantic palette in `lib/colors.ts`: green income, red expense, light blue transfer; wired into Paper theme.
4. **UI polish** — Themed submenus; removed tab checkmarks; transaction rows as bordered pills; dashboard income/expense/net as compact pills (net full width); transactions list padding; **add transaction as FAB popup** (not full-screen route).
5. **Git** — Committed polish on `main` (not pushed in that session).

---

## Current session summary

Source: Current Cursor chat (after [First polish session](53afcba3-fb28-4a48-b458-862e8da5a7f8)) — Dribbble plan, features, popup system, layout polish, `TODO.md`.

### What this session did

1. **Dribbble review** — Assessed [Hatypo Budget - Finance App](https://dribbble.com/shots/21023422-Budget-Finance-App) shot vs app; documented selective adoption in `docs/README.md` (design direction).
2. **Plan implementation** — Goals tab + CRUD/progress; `budgets` table + monthly planned vs actual on dashboard; spending donut + category % chips; transactions grouped by month; goal picker on add/edit transaction; design-direction note in docs.
3. **Navigation** — Removed **Transactions** tab; full feed at **Dashboard → View all** → `app/transactions/index.tsx` (filters + month sections kept).
4. **Layout tokens** — `lib/layout.ts` (`SCREEN_PADDING` 16 horizontal + vertical, `BORDER_RADIUS` 20); applied across tab screens; account rows with colored borders.
5. **Categories screen** — Themed headers/rows; parent row padding; tighter action buttons; smaller subcategory rows.
6. **Account detail** — Themed header card (surface + account-color border).
7. **Add transaction popup** — `InlineSelect` instead of Paper `Menu` (dropdowns stay above modal); removed outer border on income/expense/transfer type row.
8. **Popup system** — `FormPopup` shell, `PopupSheet` form layout, `ConfirmPopup` for deletes; `FabFormPopup` for + FAB flows.
9. **Popups migrated** — Add goal, monthly budgets, new account, new category, delete goal/account/category/transaction (no Paper `Dialog` / `Portal`).
10. **Docs / tracking** — Created and updated this `TODO.md` (transcript summary + open items).
11. **Git** — Commit `0d94085` on `main`: goals, budgets, unified bottom-sheet popups (not pushed).

---

## Completed (no action)

- [x] Accounts, categories, transactions (filters), dashboard periods, analytics drill-down
- [x] Goals tab (create, progress, delete, link on add/edit transaction)
- [x] Monthly budgets (planned vs actual, editor popup)
- [x] FAB popups for add transaction, add goal, edit budgets, new account, new category
- [x] Confirm popups for delete goal/account/category/transaction
- [x] Dashboard donut + category breakdown row
- [x] Transaction list grouped by month (all-transactions screen)

---

## Still to do

### Product / UX

- [ ] **All transactions (Revolut-style)** — Restructure `app/transactions/index.tsx` to better match Revolut’s transaction feed (grouping, row layout, icons/typography, filters, balance context — use Revolut as reference, keep local data model).
- [ ] **Edit transaction screen** — Still a full stack screen (`app/transaction/[id].tsx`); align layout with `PopupSheet` or keep stack but apply `popupStyles` / shared form chrome.
- [ ] **Edit goal** — No UI to edit name, target, starting balance, or archive completed goals (create + delete only).
- [ ] **Goal `target_date`** — Column exists; no date picker in add/edit goal flows.
- [ ] **Goal `account_id`** — Optional linked account in schema; no picker UI.
- [ ] **Budget editor** — Can set/update planned amounts; no way to clear/remove a category budget for the month.
- [ ] **Budget period** — Editor uses calendar month from dashboard period; confirm behavior when viewing non-current months (if period navigation expands later).
- [ ] **Orphan route** — `app/transaction/add.tsx` is a fallback; decide to remove route or style as full-screen `PopupSheet` wrapper for deep links.
- [ ] **Loan progress semantics** — Document or adjust whether loan payments should count as expenses only (not transfers) for goal progress.

### Dribbble / design (deferred per `docs/README.md`)

- [ ] Optional **dark theme** pass (keep semantic income/expense/transfer colors).
- [ ] Dashboard **income source cards** (mockup showed Salary / Interest style summary).
- [ ] **Total balance hero** + period-over-period **growth %** (needs historical snapshots).
- [ ] **Onboarding** / profile / “Hi, {name}” (explicitly out of scope unless product changes).

### Data / backend (local)

- [ ] **Loan interest & amortization** (`docs/README.md` — still planned).
- [ ] **Drizzle migrations** — `budgets` table uses `CREATE TABLE IF NOT EXISTS` in `init.ts`; run `npm run db:generate` if moving to versioned migrations for existing installs.
- [ ] **Goal type rules** — Enforce savings = income-linked, loan = expense-linked in UI or validation (optional).

### Roadmap (out of v1)

- [ ] Multi-currency
- [ ] Cloud sync, backup, auth
- [ ] Recurring transactions / budget alerts
- [ ] Receipt photos, bank import, merchant logos
- [ ] Widgets / notifications

### Docs / hygiene

- [ ] Update **`docs/README.md`** folder map (remove transactions tab, add `goals`, `app/transactions/`, popup components; SDK 54).
- [ ] Work through **verification checklist** in `docs/README.md` on device (Expo Go).
- [ ] Add **README** at repo root pointing to `docs/README.md` (if missing).

### Engineering

- [ ] **Automated tests** — Queries (`getAccountBalance`, `getGoalProgress`, `getBudgetVsActual`), period boundaries.
- [ ] **Lint / CI** — GitHub Actions or local script for `tsc` + tests.
- [ ] **Push** `main` when ready (commits exist locally; not pushed in prior sessions).

---

## Quick manual test checklist

- [ ] Fresh install: seed categories, create accounts, add transactions
- [ ] FAB add transaction: all types, goal link, inline dropdowns above popup
- [ ] Goals: create savings + loan, link tx, auto-complete at target
- [ ] Budgets: set planned amounts (month period), see progress on dashboard
- [ ] All transactions: filters + month sections
- [ ] Delete flows: goal, account, category (with tx guard), transaction
- [ ] Dark mode: categories, accounts, popups, headers
