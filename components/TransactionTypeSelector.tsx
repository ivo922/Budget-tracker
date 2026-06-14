import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { TransactionType } from '@/lib/db/schema';
import { BORDER_RADIUS } from '@/lib/layout';
import { useAppTheme, useTransactionTheme } from '@/lib/useAppTheme';

type Props = {
  value: TransactionType;
  onChange: (type: TransactionType) => void;
  /** Subset of types to show; defaults to all three. */
  types?: TransactionType[];
};

const ALL_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
];

function TypeOption({
  type,
  label,
  selected,
  onPress,
}: {
  type: TransactionType;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const colors = useTransactionTheme(type);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.option,
        {
          backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
          borderColor: selected ? theme.colors.primary : theme.colors.outline,
        },
      ]}
    >
      <Text
        variant="labelLarge"
        style={{
          color: selected ? theme.colors.onPrimary : colors.main,
          fontWeight: selected ? '700' : '500',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function TransactionTypeSelector({ value, onChange, types }: Props) {
  const options = types ? ALL_OPTIONS.filter((o) => types.includes(o.value)) : ALL_OPTIONS;

  return (
    <View style={styles.container}>
      {options.map((option) => (
        <TypeOption
          key={option.value}
          type={option.value}
          label={option.label}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
  },
});
