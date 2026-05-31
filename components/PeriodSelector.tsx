import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { PERIOD_OPTIONS, type PeriodType } from '@/lib/periods';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  value: PeriodType;
  onChange: (period: PeriodType) => void;
};

export function PeriodSelector({ value, onChange }: Props) {
  const theme = useAppTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {PERIOD_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <Chip
            key={option.value}
            selected={selected}
            onPress={() => onChange(option.value)}
            showSelectedCheck={false}
            showSelectedOverlay={false}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                borderColor: selected ? theme.colors.primary : theme.colors.outline,
              },
            ]}
            textStyle={{
              color: selected ? theme.colors.onPrimary : theme.colors.onSurface,
              fontWeight: selected ? '600' : '400',
            }}
          >
            {option.label}
          </Chip>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  chip: { borderWidth: 1 },
});
