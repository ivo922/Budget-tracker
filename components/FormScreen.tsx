import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Button, Divider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import { BORDER_RADIUS, layoutStyles, SCREEN_PADDING } from '@/lib/layout';
import { popupStyles } from '@/lib/popupStyles';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  title: string;
  children: ReactNode;
  onCancel: () => void;
  cancelLabel?: string;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmLoading?: boolean;
  confirmDestructive?: boolean;
};

export function FormScreen({
  title,
  children,
  onCancel,
  cancelLabel = 'Cancel',
  onConfirm,
  confirmLabel = 'Save',
  confirmLoading = false,
  confirmDestructive = false,
}: Props) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyleNoFab } = useCollapsibleHeader();

  return (
    <View style={layoutStyles.screen}>
      <CollapsibleScreenHeader
        title={title}
        scrollY={scrollY}
        headerHeight={headerHeight}
        leftAction="back"
        onLeftPress={onCancel}
      />
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[scrollContentStyleNoFab, styles.scrollContent]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </Animated.ScrollView>
      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.outlineVariant,
            paddingBottom: Math.max(insets.bottom, SCREEN_PADDING),
          },
        ]}
      >
        <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />
        <View style={[popupStyles.actions, styles.footerActions]}>
          <Button
            mode="text"
            onPress={onCancel}
            disabled={confirmLoading}
            textColor={theme.colors.onSurfaceVariant}
          >
            {cancelLabel}
          </Button>
          {onConfirm ? (
            <Button
              mode="contained"
              onPress={onConfirm}
              loading={confirmLoading}
              buttonColor={confirmDestructive ? theme.colors.error : theme.colors.primary}
              textColor={theme.colors.onPrimary}
              style={styles.confirmButton}
              contentStyle={styles.confirmButtonContent}
            >
              {confirmLabel}
            </Button>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: 14,
    paddingBottom: SCREEN_PADDING,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerActions: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 8,
  },
  confirmButton: {
    borderRadius: BORDER_RADIUS,
  },
  confirmButtonContent: {
    paddingHorizontal: 20,
  },
});
