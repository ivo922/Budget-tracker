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

type Props = {
  title: string;
  scrollY: SharedValue<number>;
  headerHeight: number;
  leftAction?: CollapsibleHeaderLeftAction;
  onLeftPress?: () => void;
};

export function CollapsibleScreenHeader({
  title,
  scrollY,
  headerHeight,
  leftAction,
  onLeftPress,
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

  return (
    <View
      style={[styles.wrapper, { height: headerHeight, paddingTop: headerHeight - HEADER_CONTENT_HEIGHT }]}
      pointerEvents="box-none"
    >
      <View style={styles.row} pointerEvents="box-none">
        {leftAction && onLeftPress ? (
          <View style={styles.leftSlot}>
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
          </View>
        ) : null}

        <Animated.View style={[styles.titleWrap, titleStyle]} pointerEvents="none">
          <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {title}
          </Text>
        </Animated.View>
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
  leftSlot: {
    width: 108,
    height: HEADER_CONTENT_HEIGHT,
    justifyContent: 'center',
  },
  expandedAction: {
    position: 'absolute',
    left: 0,
    justifyContent: 'center',
  },
  expandedLabel: {
    marginHorizontal: 0,
  },
  compactAction: {
    position: 'absolute',
    left: 4,
    justifyContent: 'center',
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
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 120,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
