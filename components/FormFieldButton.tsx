import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  label: string;
  value: string;
  onPress: () => void;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
};

export function FormFieldButton({ label, value, onPress, icon = 'chevron-down' }: Props) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.field,
        { backgroundColor: pressed ? theme.colors.surfaceElevated : 'transparent' },
      ]}
    >
      <View style={styles.body}>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
        <Text variant="bodyLarge" style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <MaterialCommunityIcons name={icon} size={20} color={theme.colors.onSurfaceVariant} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  body: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  value: {
    fontWeight: '600',
  },
});
