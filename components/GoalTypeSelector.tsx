import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { GoalType } from '@/lib/db/schema';
import { BORDER_RADIUS } from '@/lib/layout';
import { useAppTheme, useGoalTheme } from '@/lib/useAppTheme';

type Props = {
  value: GoalType;
  onChange: (type: GoalType) => void;
};

const OPTIONS: { value: GoalType; label: string }[] = [
  { value: 'savings', label: 'Savings' },
  { value: 'loan', label: 'Loan' },
];

function TypeOption({
  type,
  label,
  selected,
  onPress,
}: {
  type: GoalType;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const colors = useGoalTheme(type);

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

export function GoalTypeSelector({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((opt) => (
        <TypeOption
          key={opt.value}
          type={opt.value}
          label={opt.label}
          selected={value === opt.value}
          onPress={() => onChange(opt.value)}
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
