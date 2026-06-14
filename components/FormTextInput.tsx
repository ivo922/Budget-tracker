import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput, type TextInputProps } from 'react-native-paper';
import { layoutStyles } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = Omit<TextInputProps, 'mode' | 'label'> & {
  label: string;
};

export function FormTextInput({ label, style, contentStyle, ...rest }: Props) {
  const theme = useAppTheme();

  return (
    <View style={layoutStyles.formField}>
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      <TextInput
        {...rest}
        mode="flat"
        underlineColor="transparent"
        activeUnderlineColor="transparent"
        placeholderTextColor={theme.colors.onSurfaceVariant}
        style={[styles.input, { backgroundColor: 'transparent' }, style]}
        contentStyle={[styles.inputContent, contentStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    margin: 0,
    paddingHorizontal: 0,
    height: 28,
  },
  inputContent: {
    paddingHorizontal: 0,
    fontSize: 16,
    fontWeight: '600',
  },
});
