import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { FormFieldButton } from '@/components/FormFieldButton';
import { BORDER_RADIUS } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

export type InlineSelectOption = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  value?: string;
  options: InlineSelectOption[];
  onChange: (value: string | undefined) => void;
  allowClear?: boolean;
  clearLabel?: string;
};

export function InlineSelect({
  label,
  value,
  options,
  onChange,
  allowClear,
  clearLabel = 'None',
}: Props) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={[styles.wrap, open && styles.wrapOpen]}>
      <FormFieldButton
        label={label}
        value={selected?.label ?? clearLabel}
        onPress={() => setOpen((o) => !o)}
        icon={open ? 'chevron-up' : 'chevron-down'}
      />
      {open ? (
        <View
          style={[
            styles.menu,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
          ]}
        >
          {allowClear ? (
            <Pressable
              style={({ pressed }) => [
                styles.option,
                { backgroundColor: pressed ? theme.colors.surfaceElevated : 'transparent' },
              ]}
              onPress={() => {
                onChange(undefined);
                setOpen(false);
              }}
            >
              <Text variant="bodyLarge" style={styles.optionText}>
                {clearLabel}
              </Text>
            </Pressable>
          ) : null}
          {options.map((opt, index) => (
            <View key={opt.value}>
              {(allowClear || index > 0) ? (
                <View style={[styles.menuDivider, { backgroundColor: theme.colors.outlineVariant }]} />
              ) : null}
              <Pressable
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor:
                      pressed || opt.value === value
                        ? theme.colors.surfaceElevated
                        : 'transparent',
                  },
                ]}
                onPress={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <Text
                  variant="bodyLarge"
                  style={[
                    styles.optionText,
                    opt.value === value && { color: theme.colors.primary },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { zIndex: 1 },
  wrapOpen: { zIndex: 20 },
  menu: {
    marginHorizontal: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    maxHeight: 220,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionText: {
    fontWeight: '600',
  },
});
