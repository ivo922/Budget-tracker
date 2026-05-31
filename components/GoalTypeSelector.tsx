import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { GoalType } from '@/lib/db/schema';
import { BORDER_RADIUS } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  value: GoalType;
  onChange: (type: GoalType) => void;
};

const OPTIONS: { value: GoalType; label: string }[] = [
  { value: 'savings', label: 'Savings' },
  { value: 'loan', label: 'Loan' },
];

export function GoalTypeSelector({ value, onChange }: Props) {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { borderColor: theme.colors.outline }]}>
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        const accent = opt.value === 'savings' ? theme.colors.income : theme.colors.transfer;
        const container = opt.value === 'savings' ? theme.colors.incomeContainer : theme.colors.transferContainer;
        const onContainer =
          opt.value === 'savings' ? theme.colors.onIncomeContainer : theme.colors.onTransferContainer;

        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.option,
              {
                backgroundColor: selected ? container : 'transparent',
                borderColor: selected ? accent : 'transparent',
              },
            ]}
          >
            <Text variant="labelLarge" style={{ color: selected ? onContainer : theme.colors.onSurfaceVariant }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    padding: 4,
    gap: 4,
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
