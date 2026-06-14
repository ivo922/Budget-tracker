import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { Button, Text } from 'react-native-paper';
import {
  HEADER_ACTION_FADE_DISTANCE,
  HEADER_CONTENT_HEIGHT,
  HEADER_TITLE_FADE_DISTANCE,
  HEADER_TITLE_TRANSLATE_Y,
} from '@/lib/collapsibleHeader';
import { useAppTheme } from '@/lib/useAppTheme';

export type CollapsibleHeaderLeftAction = 'budget' | 'back';
export type CollapsibleHeaderRightAction = 'edit' | 'more';

type Props = {
  title: string;
  scrollY: SharedValue<number>;
  headerHeight: number;
  leftAction?: CollapsibleHeaderLeftAction;
  onLeftPress?: () => void;
  rightAction?: CollapsibleHeaderRightAction;
  onRightPress?: () => void;
};

export function CollapsibleScreenHeader({
  title,
  scrollY,
  headerHeight,
  leftAction,
  onLeftPress,
  rightAction,
  onRightPress,
}: Props) {
  const theme = useAppTheme();

  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HEADER_TITLE_FADE_DISTANCE], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, HEADER_TITLE_FADE_DISTANCE],
          [0, HEADER_TITLE_TRANSLATE_Y],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const expandedActionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HEADER_ACTION_FADE_DISTANCE], [1, 0], Extrapolation.CLAMP),
  }));

  const compactActionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [20, HEADER_ACTION_FADE_DISTANCE], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(scrollY.value, [20, HEADER_ACTION_FADE_DISTANCE], [0.85, 1], Extrapolation.CLAMP),
      },
    ],
  }));

  const iconName = leftAction === 'budget' ? 'wallet-outline' : 'arrow-left';
  const expandedLabel = leftAction === 'budget' ? 'Budget' : 'Back';
  const rightIconName =
    rightAction === 'edit' ? 'pencil-outline' : rightAction === 'more' ? 'dots-vertical' : null;
  const rightLabel = rightAction === 'edit' ? 'Edit' : rightAction === 'more' ? 'More' : null;

  return (
    <View
      style={[styles.wrapper, { height: headerHeight, paddingTop: headerHeight - HEADER_CONTENT_HEIGHT }]}
      pointerEvents="box-none"
    >
      <View style={styles.row} pointerEvents="box-none">
        <View style={styles.sideSlot}>
          {leftAction && onLeftPress ? (
            <>
              <Animated.View style={[styles.expandedAction, expandedActionStyle]}>
                <Button
                  mode="text"
                  icon={iconName}
                  onPress={onLeftPress}
                  compact
                  labelStyle={styles.expandedLabel}
                >
                  {expandedLabel}
                </Button>
              </Animated.View>
              <Animated.View style={[styles.compactAction, compactActionStyle]}>
                <Pressable
                  onPress={onLeftPress}
                  accessibilityRole="button"
                  accessibilityLabel={expandedLabel}
                  style={({ pressed }) => [
                    styles.circleButton,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.outlineVariant,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name={iconName} size={22} color={theme.colors.onSurface} />
                </Pressable>
              </Animated.View>
            </>
          ) : null}
        </View>

        <Animated.View style={[styles.titleWrap, titleStyle]} pointerEvents="none">
          <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {title}
          </Text>
        </Animated.View>

        <View style={[styles.sideSlot, styles.rightSlot]}>
          {rightAction && onRightPress && rightIconName ? (
            <>
              <Animated.View style={[styles.expandedAction, styles.expandedRightAction, expandedActionStyle]}>
                <Button
                  mode="text"
                  icon={rightIconName}
                  onPress={onRightPress}
                  compact
                  labelStyle={styles.expandedLabel}
                  contentStyle={styles.expandedRightContent}
                >
                  {rightLabel}
                </Button>
              </Animated.View>
              <Animated.View style={[styles.compactAction, styles.compactRightAction, compactActionStyle]}>
                <Pressable
                  onPress={onRightPress}
                  accessibilityRole="button"
                  accessibilityLabel={rightLabel ?? 'Action'}
                  style={({ pressed }) => [
                    styles.circleButton,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.outlineVariant,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name={rightIconName} size={22} color={theme.colors.onSurface} />
                </Pressable>
              </Animated.View>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  row: {
    height: HEADER_CONTENT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  sideSlot: {
    width: 108,
    height: HEADER_CONTENT_HEIGHT,
    justifyContent: 'center',
    flexShrink: 0,
  },
  rightSlot: {
    alignItems: 'flex-end',
  },
  expandedAction: {
    position: 'absolute',
    left: 0,
    justifyContent: 'center',
  },
  expandedRightAction: {
    right: 0,
  },
  expandedRightContent: {
    flexDirection: 'row-reverse',
  },
  expandedLabel: {
    marginHorizontal: 0,
  },
  compactAction: {
    position: 'absolute',
    left: 4,
    justifyContent: 'center',
  },
  compactRightAction: {
    right: 0,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
