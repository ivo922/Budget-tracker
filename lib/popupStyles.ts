import { StyleSheet } from 'react-native';
import { SCREEN_PADDING } from '@/lib/layout';

/** Shared inner layout for FormPopup sheets (forms + confirmations). */
export const popupStyles = StyleSheet.create({
  content: {
    padding: SCREEN_PADDING,
    gap: 12,
  },
  heading: {
    fontWeight: '600',
  },
  hint: {
    opacity: 0.8,
  },
  message: {
    opacity: 0.9,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  input: {
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    flex: 1,
  },
});
