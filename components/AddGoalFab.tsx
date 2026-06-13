import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';
import { SCREEN_PADDING } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

export function AddGoalFab() {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <FAB
      icon="plus"
      style={[styles.fab, { backgroundColor: theme.colors.primary }]}
      color={theme.colors.onPrimary}
      onPress={() => router.push('/goal/add')}
    />
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: SCREEN_PADDING,
    bottom: SCREEN_PADDING,
  },
});
