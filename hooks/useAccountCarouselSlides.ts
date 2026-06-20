import { useCallback, useState } from 'react';
import {
  accountFilterForSlide,
  buildAccountSlides,
  type AccountSlide,
} from '@/lib/accountCarousel';
import {
  getAccountBalance,
  getAccountCarouselOrder,
  getAccounts,
  getTotalNetBalance,
} from '@/lib/db/queries';

export type LoadAccountCarouselOptions = {
  primaryColor: string;
  routeAccountId?: string;
  selectedIndex: number;
};

export type AccountCarouselData = {
  slides: AccountSlide[];
  selectedIndex: number;
  accountFilter: string | undefined;
};

export async function loadAccountCarouselData(
  options: LoadAccountCarouselOptions,
): Promise<AccountCarouselData> {
  const [rows, order] = await Promise.all([getAccounts(), getAccountCarouselOrder()]);
  const [total, ...balances] = await Promise.all([
    getTotalNetBalance(),
    ...rows.map((a) => getAccountBalance(a.id)),
  ]);
  const slides = buildAccountSlides({
    accounts: rows,
    balances,
    total,
    primaryColor: options.primaryColor,
    order,
  });

  let selectedIndex = options.selectedIndex < slides.length ? options.selectedIndex : 0;
  if (options.routeAccountId) {
    const match = slides.findIndex((s) => s.id === options.routeAccountId);
    if (match >= 0) selectedIndex = match;
  }

  return {
    slides,
    selectedIndex,
    accountFilter: accountFilterForSlide(slides[selectedIndex]),
  };
}

export function useAccountCarouselSlides(primaryColor: string, routeAccountId?: string) {
  const [slides, setSlides] = useState<AccountSlide[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await loadAccountCarouselData({
      primaryColor,
      routeAccountId,
      selectedIndex,
    });
    setSlides(data.slides);
    setSelectedIndex(data.selectedIndex);
    setLoading(false);
    return data;
  }, [primaryColor, routeAccountId, selectedIndex]);

  return {
    slides,
    selectedIndex,
    setSelectedIndex,
    loading,
    refresh,
    accountFilter: accountFilterForSlide(slides[selectedIndex]),
  };
}
