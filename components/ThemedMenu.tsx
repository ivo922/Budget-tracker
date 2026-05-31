import React from 'react';
import { Menu, type MenuProps } from 'react-native-paper';
import { useAppTheme } from '@/lib/useAppTheme';

export function ThemedMenu({ contentStyle, elevation = 0, ...props }: MenuProps) {
  const theme = useAppTheme();

  return (
    <Menu
      {...props}
      elevation={elevation}
      contentStyle={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.roundness,
          borderWidth: 1,
          borderColor: theme.colors.outline,
        },
        contentStyle,
      ]}
    />
  );
}

export const ThemedMenuItem = Menu.Item;
