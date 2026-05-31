import React, { type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { BORDER_RADIUS, SCREEN_PADDING } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

const FAB_SIZE = 56;
const FAB_MARGIN = SCREEN_PADDING;
const POPUP_GAP = 12;

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Change to remount children when reopened. */
  contentKey?: number | string;
};

export function FormPopup({ visible, onClose, children, contentKey }: Props) {
  const theme = useAppTheme();
  const { width, height } = useWindowDimensions();
  const popupWidth = Math.min(width - SCREEN_PADDING * 2, 400);
  const popupMaxHeight = height * 0.62;
  const popupBottom = FAB_MARGIN + FAB_SIZE + POPUP_GAP;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
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
          <View key={contentKey} collapsable={false}>
            {children}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  popup: {
    position: 'absolute',
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
});
