import React, { useState } from 'react';
import { FormFieldButton } from '@/components/FormFieldButton';
import { ThemedMenu, ThemedMenuItem } from '@/components/ThemedMenu';
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
    <ThemedMenu
      visible={open}
      onDismiss={() => setOpen(false)}
      anchor={
        <FormFieldButton
          label={label}
          value={selected?.label ?? clearLabel}
          onPress={() => setOpen(true)}
          icon={open ? 'chevron-up' : 'chevron-down'}
        />
      }
    >
      {allowClear ? (
        <ThemedMenuItem
          title={clearLabel}
          onPress={() => {
            onChange(undefined);
            setOpen(false);
          }}
        />
      ) : null}
      {options.map((opt) => (
        <ThemedMenuItem
          key={opt.value}
          title={opt.label}
          titleStyle={opt.value === value ? { color: theme.colors.primary, fontWeight: '600' } : undefined}
          onPress={() => {
            onChange(opt.value);
            setOpen(false);
          }}
        />
      ))}
    </ThemedMenu>
  );
}
