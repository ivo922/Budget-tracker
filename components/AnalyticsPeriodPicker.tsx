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
  const extendedActive = extendedSelected && !QUICK_VALUES.has(value);

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
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
            accessibilityRole="button"
            accessibilityLabel={
              extendedActive
                ? `More date ranges, ${extendedSelected?.label} selected`
                : 'More date ranges'
            }
            style={({ pressed }) => [
              styles.menuButton,
              {
                backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.surface,
                borderColor: extendedActive ? theme.colors.primary : theme.colors.outline,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="dots-vertical"
              size={18}
              color={extendedActive ? theme.colors.primary : theme.colors.onSurfaceVariant}
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chips: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: { borderWidth: 1 },
  wrap: { zIndex: 1 },
  wrapOpen: { zIndex: 20 },
  menuButton: {
    height: 32,
    minWidth: 32,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    minWidth: 180,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  menuDivider: { height: StyleSheet.hairlineWidth },
  option: { paddingHorizontal: 14, paddingVertical: 12 },
  optionText: { fontWeight: '600' },
});
