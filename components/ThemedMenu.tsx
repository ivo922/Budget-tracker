import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Menu, Portal, Surface, type MD3Elevation } from 'react-native-paper';
import { BORDER_RADIUS } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type AnchorAlign = 'left' | 'right';

type Props = {
  visible: boolean;
  onDismiss?: () => void;
  anchor: React.ReactNode;
  anchorAlign?: AnchorAlign;
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  elevation?: MD3Elevation;
  overlayAccessibilityLabel?: string;
};

const SCREEN_INDENT = 8;
const MAX_MENU_HEIGHT = 280;

export function ThemedMenu({
  visible,
  onDismiss,
  anchor,
  anchorAlign = 'right',
  children,
  contentStyle,
  style,
  elevation = 4,
  overlayAccessibilityLabel = 'Close menu',
}: Props) {
  const theme = useAppTheme();
  const anchorRef = useRef<View>(null);
  const [position, setPosition] = useState<{
    top: number;
    left?: number;
    right?: number;
    minWidth: number;
    maxWidth: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!visible) {
      setPosition(null);
      return;
    }

    const frame = requestAnimationFrame(() => {
      anchorRef.current?.measureInWindow((x, y, width, height) => {
        const windowWidth = Dimensions.get('window').width;
        const top = y + height + 4;
        const maxWidth = windowWidth - 2 * SCREEN_INDENT;

        if (anchorAlign === 'right') {
          setPosition({
            top,
            right: windowWidth - (x + width),
            minWidth: Math.min(width, maxWidth),
            maxWidth,
          });
          return;
        }

        setPosition({
          top,
          left: Math.max(SCREEN_INDENT, x),
          minWidth: Math.min(width, maxWidth),
          maxWidth,
        });
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [visible, anchorAlign]);

  return (
    <View ref={anchorRef} collapsable={false} style={style}>
      {anchor}
      {visible && position ? (
        <Portal>
          <Pressable
            accessibilityLabel={overlayAccessibilityLabel}
            accessibilityRole="button"
            onPress={onDismiss}
            style={styles.overlay}
          />
          <Surface
            elevation={elevation}
            style={[
              styles.menu,
              {
                top: position.top,
                left: position.left,
                right: position.right,
                minWidth: position.minWidth,
                maxWidth: position.maxWidth,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline,
              },
              contentStyle,
            ]}
          >
            <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll}>
              {children}
            </ScrollView>
          </Surface>
        </Portal>
      ) : null}
    </View>
  );
}

export const ThemedMenuItem = Menu.Item;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  menu: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  scroll: {
    maxHeight: MAX_MENU_HEIGHT,
  },
});
