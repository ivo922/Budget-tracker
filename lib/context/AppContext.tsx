import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { initDatabase } from '@/lib/db';
import type { PeriodRange, PeriodType } from '@/lib/periods';
import { getPeriodRange } from '@/lib/periods';

const isWeb = Platform.OS === 'web';

type AppContextValue = {
  ready: boolean;
  period: PeriodType;
  periodRange: PeriodRange;
  setPeriod: (period: PeriodType) => void;
  refreshKey: number;
  refresh: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (isWeb) return;

    let active = true;
    initDatabase()
      .then(() => {
        if (active) setReady(true);
      })
      .catch(console.error);

    return () => {
      active = false;
    };
  }, []);

  const periodRange = useMemo(() => getPeriodRange(period), [period, refreshKey]);

  const value = useMemo(
    () => ({
      ready,
      period,
      periodRange,
      setPeriod,
      refreshKey,
      refresh: () => setRefreshKey((k) => k + 1),
    }),
    [ready, period, periodRange, refreshKey],
  );

  if (isWeb) {
    return (
      <AppContext.Provider value={value}>
        <View style={styles.webUnsupported}>
          <Text variant="headlineSmall">Mobile app required</Text>
          <Text variant="bodyMedium" style={styles.webMessage}>
            Budget Tracker uses on-device SQLite and is designed for Expo Go on iOS or Android.
            Run the dev server and scan the QR code with Expo Go:
          </Text>
          <Text variant="bodyMedium" style={styles.webCommands}>
            npx expo start
          </Text>
        </View>
      </AppContext.Provider>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

const styles = StyleSheet.create({
  webUnsupported: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  webMessage: { textAlign: 'center' },
  webCommands: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    textAlign: 'center',
  },
});

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
