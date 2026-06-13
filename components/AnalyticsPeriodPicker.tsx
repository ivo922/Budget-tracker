import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import {
  ANALYTICS_EXTENDED_PERIODS,
  ANALYTICS_QUICK_PERIODS,
  type AnalyticsPeriod,
  type PeriodType,
} from '@/lib/periods';
import { BORDER_RADIUS } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  value: AnalyticsPeriod;
  onChange: (period: AnalyticsPeriod) => void;
};

const QUICK_VALUES = new Set<string>(ANALYTICS_QUICK_PERIODS.map((o) => o.value));

export function AnalyticsPeriodPicker({ value, onChange }: Props) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const extendedSelected = ANALYTICS_EXTENDED_PERIODS.find((o) => o.value === value);
  const showExtendedPill = extendedSelected && !QUICK_VALUES.has(value);

  return (
    <View style={styles.wrapper}>
      <View style={styles.chips}>
        {ANALYTICS_QUICK_PERIODS.map((option) => {
          const selected = value === option.value;
          return (
            <Chip
              key={option.value}
              selected={selected}
              onPress={() => onChange(option.value as PeriodType)}
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
      </View>

      <View style={[styles.wrap, open && styles.wrapOpen]}>
        <Pressable
          onPress={() => setOpen((o) => !o)}
          style={({ pressed }) => [
            styles.pill,
            {
              backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.outlineVariant,
              borderColor: showExtendedPill ? theme.colors.primary : 'transparent',
              borderWidth: showExtendedPill ? 1 : 0,
            },
          ]}
        >
          <Text variant="bodyMedium" style={styles.pillText}>
            {showExtendedPill ? extendedSelected?.label : 'More ranges'}
          </Text>
          <MaterialCommunityIcons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
        </Pressable>

        {open ? (
          <View
            style={[
              styles.menu,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
            ]}
          >
            {ANALYTICS_EXTENDED_PERIODS.map((opt, index) => {
              const selected = value === opt.value;
              return (
                <View key={opt.value}>
                  {index > 0 ? (
                    <View
                      style={[styles.menuDivider, { backgroundColor: theme.colors.outlineVariant }]}
                    />
                  ) : null}
                  <Pressable
                    style={({ pressed }) => [
                      styles.option,
                      {
                        backgroundColor:
                          pressed || selected ? theme.colors.surfaceElevated : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <Text
                      variant="bodyLarge"
                      style={[styles.optionText, selected && { color: theme.colors.primary }]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1 },
  wrap: { zIndex: 1 },
  wrapOpen: { zIndex: 20 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BORDER_RADIUS,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pillText: { fontWeight: '600' },
  menu: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  menuDivider: { height: StyleSheet.hairlineWidth },
  option: { paddingHorizontal: 14, paddingVertical: 12 },
  optionText: { fontWeight: '600' },
});
