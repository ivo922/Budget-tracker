import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from 'react-native-paper';
import { layoutStyles } from '@/lib/layout';
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
        layoutStyles.row,
        { backgroundColor: pressed ? theme.colors.surfaceElevated : 'transparent' },
      ]}
    >
      <View style={layoutStyles.rowBody}>
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

const styles = {
  value: { fontWeight: '600' as const },
};
