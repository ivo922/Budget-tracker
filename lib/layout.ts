import { StyleSheet, type ViewStyle } from 'react-native';

/** Screen content inset on all sides (horizontal and vertical). */
export const SCREEN_PADDING = 16;

/** Bottom inset when a FAB sits above the tab bar. */
export const SCREEN_PADDING_BOTTOM_FAB = 88;

/** Standard corner radius for cards, dialogs, menus, and popups. */
export const BORDER_RADIUS = 20;

export const screenContentStyle: ViewStyle = {
  paddingHorizontal: SCREEN_PADDING,
  paddingVertical: SCREEN_PADDING,
};

export const screenScrollContentStyle: ViewStyle = {
  paddingHorizontal: SCREEN_PADDING,
  paddingTop: SCREEN_PADDING,
  paddingBottom: SCREEN_PADDING_BOTTOM_FAB,
};

export const screenListContentStyle: ViewStyle = {
  paddingHorizontal: SCREEN_PADDING,
  paddingTop: SCREEN_PADDING,
  paddingBottom: SCREEN_PADDING_BOTTOM_FAB,
};

/** Scroll content on screens without a bottom FAB. */
export const screenScrollContentNoFabStyle: ViewStyle = {
  paddingHorizontal: SCREEN_PADDING,
  paddingVertical: SCREEN_PADDING,
};

export const layoutStyles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  screenPadded: {
    flex: 1,
    padding: SCREEN_PADDING,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: SCREEN_PADDING,
  },
});
