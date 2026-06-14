import React, { type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { ROW_PADDING_H, ROW_PADDING_V } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  variant?: 'bodySmall' | 'bodyMedium' | 'labelMedium' | 'labelLarge';
  inset?: boolean;
  onPress?: () => void;
};

export function FormHelperText({
  children,
  style,
  variant = 'bodySmall',
  inset = true,
  onPress,
}: Props) {
  const theme = useAppTheme();

  return (
    <Text
      variant={variant}
      onPress={onPress}
      style={[
        inset && styles.inset,
        { color: theme.colors.onSurfaceVariant },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  inset: {
    paddingHorizontal: ROW_PADDING_H,
    paddingBottom: ROW_PADDING_V,
  },
});
