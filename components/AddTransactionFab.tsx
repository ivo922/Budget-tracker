import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { FAB } from 'react-native-paper';
import { AddTransactionForm } from '@/components/AddTransactionForm';
import { useAppTheme } from '@/lib/useAppTheme';

const FAB_SIZE = 56;
const FAB_MARGIN = 16;
const POPUP_GAP = 12;

export function AddTransactionFab() {
  const theme = useAppTheme();
  const { width, height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const popupWidth = Math.min(width - 32, 400);
  const popupMaxHeight = height * 0.62;
  const popupBottom = FAB_MARGIN + FAB_SIZE + POPUP_GAP;

  const close = () => setOpen(false);
  const openForm = () => {
    setFormKey((k) => k + 1);
    setOpen(true);
  };

  return (
    <>
      <FAB
        icon={open ? 'close' : 'plus'}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => (open ? close() : openForm())}
      />

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable
            style={[
              styles.popup,
              {
                width: popupWidth,
                maxHeight: popupMaxHeight,
                bottom: popupBottom,
                right: FAB_MARGIN,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <AddTransactionForm key={formKey} onClose={close} onSaved={close} />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: FAB_MARGIN,
    bottom: FAB_MARGIN,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  popup: {
    position: 'absolute',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
});
