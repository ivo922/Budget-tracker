import type { Account } from '@/lib/db/schema';

export const ALL_ACCOUNTS_SLIDE_ID = '__all__';
export const ADD_ACCOUNT_SLIDE_ID = 'add';

export type AccountSlide = {
  id: string | null;
  name: string;
  color: string;
  balance: number;
};

export function isAllAccountsSlide(slide: AccountSlide): boolean {
  return slide.id === ALL_ACCOUNTS_SLIDE_ID;
}

export function isAddAccountSlide(slide: AccountSlide): boolean {
  return slide.id === ADD_ACCOUNT_SLIDE_ID;
}

export function isRealAccountSlide(slide: AccountSlide): boolean {
  return !!slide.id && !isAddAccountSlide(slide) && !isAllAccountsSlide(slide);
}

export function accountFilterForSlide(slide: AccountSlide | undefined): string | undefined {
  if (!slide?.id || isAddAccountSlide(slide) || isAllAccountsSlide(slide)) return undefined;
  return slide.id;
}

export function normalizeCarouselOrder(order: string[], accounts: Account[]): string[] {
  const accountIds = new Set(accounts.map((account) => account.id));
  const seen = new Set<string>();
  const result: string[] = [];

  for (const token of order) {
    if (token === ALL_ACCOUNTS_SLIDE_ID) {
      if (!seen.has(token)) {
        result.push(token);
        seen.add(token);
      }
      continue;
    }
    if (accountIds.has(token) && !seen.has(token)) {
      result.push(token);
      seen.add(token);
    }
  }

  if (!seen.has(ALL_ACCOUNTS_SLIDE_ID)) {
    result.unshift(ALL_ACCOUNTS_SLIDE_ID);
  }

  for (const account of accounts) {
    if (!seen.has(account.id)) {
      result.push(account.id);
    }
  }

  return result;
}

export function buildAccountSlides(params: {
  accounts: Account[];
  balances: number[];
  total: number;
  primaryColor: string;
  order: string[];
}): AccountSlide[] {
  const { accounts, balances, total, primaryColor, order } = params;
  const balanceById = new Map(accounts.map((account, index) => [account.id, balances[index]]));
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const tokens = normalizeCarouselOrder(order, accounts);

  const slides: AccountSlide[] = tokens.map((token) => {
    if (token === ALL_ACCOUNTS_SLIDE_ID) {
      return {
        id: ALL_ACCOUNTS_SLIDE_ID,
        name: 'All accounts',
        color: primaryColor,
        balance: total,
      };
    }
    const account = accountById.get(token)!;
    return {
      id: account.id,
      name: account.name,
      color: account.color,
      balance: balanceById.get(account.id) ?? 0,
    };
  });

  slides.push({
    id: ADD_ACCOUNT_SLIDE_ID,
    name: 'Add account',
    color: primaryColor,
    balance: 0,
  });

  return slides;
}

if (__DEV__) {
  const accounts = [
    { id: 'a', name: 'A', color: '#000', sortOrder: 0 },
    { id: 'b', name: 'B', color: '#111', sortOrder: 1 },
  ] as Account[];
  const order = normalizeCarouselOrder(['b', ALL_ACCOUNTS_SLIDE_ID, 'a'], accounts);
  console.assert(
    order.join(',') === ['b', ALL_ACCOUNTS_SLIDE_ID, 'a'].join(','),
    'normalizeCarouselOrder keeps All accounts position',
  );
}
