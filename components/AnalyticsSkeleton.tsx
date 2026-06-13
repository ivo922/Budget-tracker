import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/lib/useAppTheme';
import { BORDER_RADIUS } from '@/lib/layout';

export function AnalyticsSkeleton() {
  const theme = useAppTheme();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.hero, { backgroundColor: theme.colors.outlineVariant }]} />
      <View style={[styles.pill, { backgroundColor: theme.colors.outlineVariant }]} />
      <View style={[styles.donut, { backgroundColor: theme.colors.outlineVariant }]} />
      {[0, 1, 2].map((key) => (
        <View
          key={key}
          style={[styles.row, { backgroundColor: theme.colors.outlineVariant }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 12 },
  hero: { height: 88, borderRadius: BORDER_RADIUS },
  pill: { height: 48, borderRadius: BORDER_RADIUS },
  donut: { height: 200, borderRadius: BORDER_RADIUS, alignSelf: 'center', width: '70%' },
  row: { height: 88, borderRadius: BORDER_RADIUS },
});
