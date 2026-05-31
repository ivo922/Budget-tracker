import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

type Props = {
  title: string;
  message: string;
  icon?: string;
};

export function EmptyState({ title, message }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
});
