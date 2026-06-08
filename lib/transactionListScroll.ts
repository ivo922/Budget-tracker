/** Minimal section shape for scroll offset math. */
type ScrollSection = { data: readonly unknown[] };

/** Extra top inset subtracted from scroll target so the first row clears overlays. */
export const MONTH_SCROLL_EXTRA_OFFSET = 120;

/** Approximate layout sizes for scroll offset estimation (SectionList has no getItemLayout). */
const LAYOUT = {
  dayHeader: 44,
  row: 64,
  divider: 1,
  sectionGap: 12,
} as const;

/** Scroll offset to the first transaction row of a day section. */
export function estimateScrollOffsetToSection(
  sections: readonly ScrollSection[],
  sectionIndex: number,
  contentPaddingTop: number,
  listHeaderHeight: number,
): number {
  let offset = contentPaddingTop + listHeaderHeight;

  for (let i = 0; i < sectionIndex; i++) {
    const section = sections[i];
    offset += LAYOUT.dayHeader;
    offset += section.data.length * LAYOUT.row;
    offset += Math.max(0, section.data.length - 1) * LAYOUT.divider;
    offset += LAYOUT.sectionGap;
  }

  // Skip the day header so the first transaction row aligns under the month bar.
  offset += LAYOUT.dayHeader;
  return offset;
}

type ScrollableList = {
  scrollToOffset?: (params: { offset: number; animated?: boolean }) => void;
  getScrollResponder?: () =>
    | { scrollTo?: (params: { y: number; animated?: boolean }) => void }
    | undefined;
};

export type { ScrollableList };

export function scrollListToOffset(list: ScrollableList, offset: number, animated = true) {
  const y = Math.max(0, offset);
  if (list.scrollToOffset) {
    list.scrollToOffset({ offset: y, animated });
    return;
  }
  list.getScrollResponder?.()?.scrollTo?.({ y, animated });
}
