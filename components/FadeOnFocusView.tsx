import { useFocusEffect } from 'expo-router';
import { PropsWithChildren, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useAppTheme } from '@/lib/useAppTheme';

const DURATION_MS = 200;
/** ponytail: never hit 0 — transparent layer shows window white under tabs */
const MIN_OPACITY = 0.92;

export function FadeOnFocusView({ children }: PropsWithChildren) {
  const theme = useAppTheme();
  const opacity = useSharedValue(1);

  useFocusEffect(
    useCallback(() => {
      opacity.value = MIN_OPACITY;
      opacity.value = withTiming(1, { duration: DURATION_MS });
    }, [opacity]),
  );

  const style = useAnimatedStyle(() => ({ flex: 1, opacity: opacity.value }));
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={style}>{children}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
