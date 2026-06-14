import { StyleSheet, type ViewStyle } from 'react-native';

/** Screen content inset on all sides (horizontal and vertical). */
export const SCREEN_PADDING = 16;

/** Bottom inset when a FAB sits above the tab bar. */
export const SCREEN_PADDING_BOTTOM_FAB = 88;

/** Standard corner radius for cards, dialogs, menus, and popups. */
export const BORDER_RADIUS = 20;

/** Between distinct widgets on a screen. */
export const SECTION_GAP = 16;

/** Between same-type standalone cards (e.g. goals list). */
export const CARD_GAP = 12;

/** Standard bordered card padding. */
export const CARD_PADDING = 16;

/** Gap between stacked content inside a card. */
export const CARD_INNER_GAP = 8;

/** List row / pill horizontal padding. */
export const ROW_PADDING_H = 14;

/** List row / pill vertical padding. */
export const ROW_PADDING_V = 12;

/** Gap between icon and body in a row. */
export const ROW_GAP = 12;

/** Gap between title and subtitle in a row body. */
export const ROW_BODY_GAP = 4;

/** Inline pill horizontal padding. */
export const PILL_PADDING_H = 14;

/** Inline pill vertical padding. */
export const PILL_PADDING_V = 12;

/** Gap between grouped containers (e.g. day groups). */
export const GROUPED_LIST_GAP = 8;

/** Standard progress bar height. */
export const PROGRESS_BAR_HEIGHT = 8;

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
  card: {
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    padding: CARD_PADDING,
    gap: CARD_INNER_GAP,
  },
  cardCompact: {
    padding: 12,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ROW_GAP,
    paddingHorizontal: ROW_PADDING_H,
    paddingVertical: ROW_PADDING_V,
  },
  rowBody: {
    flex: 1,
    gap: ROW_BODY_GAP,
    minWidth: 0,
  },
  pill: {
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    paddingHorizontal: PILL_PADDING_H,
    paddingVertical: PILL_PADDING_V,
  },
  groupedListCard: {
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: CARD_GAP,
  },
  progressBar: {
    height: PROGRESS_BAR_HEIGHT,
    borderRadius: BORDER_RADIUS,
  },
});
