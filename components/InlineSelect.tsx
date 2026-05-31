import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
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
      <Button mode="outlined" onPress={() => setOpen((o) => !o)} style={styles.trigger}>
        {label}: {selected?.label ?? clearLabel}
      </Button>
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
              style={styles.option}
              onPress={() => {
                onChange(undefined);
                setOpen(false);
              }}
            >
              <Text variant="bodyMedium">{clearLabel}</Text>
            </Pressable>
          ) : null}
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              style={[
                styles.option,
                opt.value === value && { backgroundColor: theme.colors.surfaceElevated },
              ]}
              onPress={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              <Text variant="bodyMedium">{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { zIndex: 1 },
  wrapOpen: { zIndex: 20 },
  trigger: { alignSelf: 'stretch' },
  menu: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    maxHeight: 220,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
