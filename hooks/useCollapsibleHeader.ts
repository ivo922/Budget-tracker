import { useMemo } from 'react';
import { type ViewStyle } from 'react-native';
import { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HEADER_CONTENT_HEIGHT } from '@/lib/collapsibleHeader';
import { SCREEN_PADDING, SCREEN_PADDING_BOTTOM_FAB } from '@/lib/layout';

export function useCollapsibleHeader() {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerHeight = insets.top + HEADER_CONTENT_HEIGHT;

  const scrollContentStyle = useMemo<ViewStyle>(
    () => ({
      paddingTop: headerHeight,
      paddingHorizontal: SCREEN_PADDING,
      paddingBottom: SCREEN_PADDING_BOTTOM_FAB,
    }),
    [headerHeight],
  );

  const scrollContentStyleNoFab = useMemo<ViewStyle>(
    () => ({
      paddingTop: headerHeight,
      paddingHorizontal: SCREEN_PADDING,
      paddingBottom: SCREEN_PADDING,
    }),
    [headerHeight],
  );

  return {
    scrollY,
    scrollHandler,
    headerHeight,
    scrollContentStyle,
    scrollContentStyleNoFab,
  };
}
