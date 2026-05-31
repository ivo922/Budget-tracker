import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { PERIOD_OPTIONS, type PeriodType } from '@/lib/periods';

type Props = {
  value: PeriodType;
  onChange: (period: PeriodType) => void;
};

export function PeriodSelector({ value, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {PERIOD_OPTIONS.map((option) => (
        <Chip
          key={option.value}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
          style={styles.chip}
        >
          {option.label}
        </Chip>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: { marginRight: 4 },
});
