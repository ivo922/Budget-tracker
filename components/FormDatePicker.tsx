import DateTimePicker from '@react-native-community/datetimepicker';
import React from 'react';
import { Platform } from 'react-native';

type Props = {
  visible: boolean;
  value: Date;
  onChange: (date: Date) => void;
  onDismiss?: () => void;
  minimumDate?: Date;
};

export function FormDatePicker({ visible, value, onChange, onDismiss, minimumDate }: Props) {
  if (!visible) return null;

  return (
    <DateTimePicker
      value={value}
      mode="date"
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      minimumDate={minimumDate}
      onChange={(_, selected) => {
        if (Platform.OS !== 'ios') onDismiss?.();
        if (selected) onChange(selected);
      }}
    />
  );
}
