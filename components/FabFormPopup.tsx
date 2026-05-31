import React, { useState, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';
import { FormPopup } from '@/components/FormPopup';
import { SCREEN_PADDING } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  children: (props: { close: () => void }) => ReactNode;
  resetOnOpen?: boolean;
};

export function FabFormPopup({ children, resetOnOpen = true }: Props) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const [contentKey, setContentKey] = useState(0);

  const close = () => setOpen(false);
  const openForm = () => {
    if (resetOnOpen) setContentKey((k) => k + 1);
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

      <FormPopup visible={open} onClose={close} contentKey={contentKey}>
        {children({ close })}
      </FormPopup>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: SCREEN_PADDING,
    bottom: SCREEN_PADDING,
  },
});
