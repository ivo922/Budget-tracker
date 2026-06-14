import React from 'react';
import { View } from 'react-native';
import { Switch, Text } from 'react-native-paper';
import { layoutStyles } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function FormFieldSwitch({ label, value, onValueChange }: Props) {
  const theme = useAppTheme();

  return (
    <View style={[layoutStyles.row, layoutStyles.formField]}>
      <View style={layoutStyles.rowBody}>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}
