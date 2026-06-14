import { StyleSheet } from 'react-native';
import {
  FORM_SECTION_GAP,
  ROW_GAP,
  ROW_PADDING_H,
  ROW_PADDING_V,
  SCREEN_PADDING,
} from '@/lib/layout';

/** Shared layout for full-screen form views. */
export const popupStyles = StyleSheet.create({
  content: {
    padding: SCREEN_PADDING,
    gap: FORM_SECTION_GAP,
  },
  heading: {
    fontWeight: '700',
  },
  hint: {
    color: undefined,
    opacity: 0.8,
  },
  message: {
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ROW_GAP,
    paddingHorizontal: ROW_PADDING_H,
    paddingVertical: ROW_PADDING_V,
  },
  label: {
    flex: 1,
    fontWeight: '600',
  },
});
