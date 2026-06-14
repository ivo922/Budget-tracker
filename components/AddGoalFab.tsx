import React from 'react';
import { Modal, StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';
import { AddGoalForm } from '@/components/AddGoalForm';
import type { GoalType } from '@/lib/db/schema';
import { SCREEN_PADDING } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  onOpenAdd?: () => void;
  addVisible?: boolean;
  onCloseAdd?: () => void;
  onSaved?: (goalId?: string) => void;
  initialType?: GoalType;
};

export function AddGoalFab({
  onOpenAdd,
  addVisible = false,
  onCloseAdd,
  onSaved,
  initialType,
}: Props) {
  const theme = useAppTheme();

  return (
    <>
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={onOpenAdd}
      />
      <Modal visible={addVisible} animationType="slide" presentationStyle="pageSheet">
        <AddGoalForm
          onClose={() => onCloseAdd?.()}
          onSaved={onSaved}
          initialType={initialType}
        />
      </Modal>
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
