import React, { Children, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Divider } from 'react-native-paper';
import { BORDER_RADIUS } from '@/lib/layout';
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
        styles.group,
        {
          backgroundColor: theme.colors.outlineVariant,
          borderRadius: BORDER_RADIUS,
        },
      ]}
    >
      {items.map((child, index) => (
        <View key={index}>
          {child}
          {index < items.length - 1 ? (
            <Divider style={{ backgroundColor: theme.colors.outline }} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    overflow: 'hidden',
  },
});
