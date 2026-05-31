import React, { type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { popupStyles } from '@/lib/popupStyles';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  title: string;
  children: ReactNode;
  scrollable?: boolean;
  onCancel: () => void;
  cancelLabel?: string;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmLoading?: boolean;
  confirmDestructive?: boolean;
};

export function PopupSheet({
  title,
  children,
  scrollable = true,
  onCancel,
  cancelLabel = 'Cancel',
  onConfirm,
  confirmLabel = 'Save',
  confirmLoading = false,
  confirmDestructive = false,
}: Props) {
  const theme = useAppTheme();

  const footer = (
    <View style={popupStyles.actions}>
      <Button mode="outlined" onPress={onCancel} disabled={confirmLoading}>
        {cancelLabel}
      </Button>
      {onConfirm ? (
        <Button
          mode="contained"
          onPress={onConfirm}
          loading={confirmLoading}
          buttonColor={confirmDestructive ? theme.colors.error : undefined}
          textColor={confirmDestructive ? theme.colors.onPrimary : undefined}
        >
          {confirmLabel}
        </Button>
      ) : null}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView contentContainerStyle={popupStyles.content} keyboardShouldPersistTaps="handled">
        <Text variant="titleMedium" style={popupStyles.heading}>
          {title}
        </Text>
        {children}
        {footer}
      </ScrollView>
    );
  }

  return (
    <View style={popupStyles.content}>
      <Text variant="titleMedium" style={popupStyles.heading}>
        {title}
      </Text>
      {children}
      {footer}
    </View>
  );
}
