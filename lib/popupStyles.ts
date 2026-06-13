import { StyleSheet } from 'react-native';
import { SCREEN_PADDING } from '@/lib/layout';

/** Shared layout for full-screen form views. */
export const popupStyles = StyleSheet.create({
  content: {
    padding: SCREEN_PADDING,
    gap: 14,
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
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  label: {
    flex: 1,
    fontWeight: '600',
  },
});
