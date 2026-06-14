import React, { Children, type ReactNode } from 'react';
import { View } from 'react-native';
import { Divider } from 'react-native-paper';
import { layoutStyles } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  children: ReactNode;
};

export function FormFieldGroup({ children }: Props) {
  const theme = useAppTheme();
  const items = Children.toArray(children).filter(Boolean);

  if (items.length === 0) return null;

  return (
    <View
      style={[
        layoutStyles.formGroup,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
    >
      {items.map((child, index) => (
        <View key={index}>
          {child}
          {index < items.length - 1 ? (
            <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />
          ) : null}
        </View>
      ))}
    </View>
  );
}
