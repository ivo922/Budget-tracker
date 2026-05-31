import React from 'react';
import { Text } from 'react-native-paper';
import { FormPopup } from '@/components/FormPopup';
import { PopupSheet } from '@/components/PopupSheet';
import { popupStyles } from '@/lib/popupStyles';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmLabel?: string;
  confirmLoading?: boolean;
  destructive?: boolean;
};

export function ConfirmPopup({
  visible,
  onClose,
  title,
  message,
  onConfirm,
  confirmLabel = 'Delete',
  confirmLoading = false,
  destructive = true,
}: Props) {
  return (
    <FormPopup visible={visible} onClose={onClose}>
      <PopupSheet
        title={title}
        scrollable={false}
        onCancel={onClose}
        onConfirm={onConfirm}
        confirmLabel={confirmLabel}
        confirmLoading={confirmLoading}
        confirmDestructive={destructive}
      >
        <Text variant="bodyMedium" style={popupStyles.message}>
          {message}
        </Text>
      </PopupSheet>
    </FormPopup>
  );
}
