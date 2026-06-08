import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from 'react-native-paper';
import { monthNavLabel } from '@/lib/groupTransactions';
import { SCREEN_PADDING } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

const ISLAND_PADDING_H = 6;
const ISLAND_PADDING_V = 6;
const INNER_GAP = 8;
const CHIP_GAP = 6;
const BACK_BUTTON_SIZE = 40;
const MONTHS_VISIBLE = 3.5;

/** Approximate island row height (back button + vertical padding). */
export const MONTH_NAV_BAR_FALLBACK_HEIGHT = 52;

type Props = {
  months: string[];
  activeMonth: string;
  onSelectMonth: (monthKey: string) => void;
  onBackPress: () => void;
};

export function MonthNavBar({ months, activeMonth, onSelectMonth, onBackPress }: Props) {
  const theme = useAppTheme();
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const chipLayouts = useRef<Record<string, { x: number; width: number }>>({});

  const islandWidth = screenWidth - SCREEN_PADDING * 2;
  const monthsViewportWidth =
    islandWidth -
    ISLAND_PADDING_H * 2 -
    BACK_BUTTON_SIZE -
    INNER_GAP * 2 -
    StyleSheet.hairlineWidth;
  const chipWidth = (monthsViewportWidth - CHIP_GAP * 3) / MONTHS_VISIBLE;

  useEffect(() => {
    const layout = chipLayouts.current[activeMonth];
    if (layout && scrollRef.current) {
      scrollRef.current.scrollTo({
        x: Math.max(0, layout.x - CHIP_GAP),
        animated: true,
      });
    }
  }, [activeMonth]);

  return (
    <View style={[styles.island, { backgroundColor: theme.colors.surface }]}>
      <Pressable
        onPress={onBackPress}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={({ pressed }) => [
          styles.backButton,
          {
            backgroundColor: theme.colors.surfaceElevated,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <MaterialCommunityIcons name="arrow-left" size={22} color={theme.colors.onSurface} />
      </Pressable>

      <View style={[styles.separator, { backgroundColor: theme.colors.outlineVariant }]} />

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.monthsScroll, { width: monthsViewportWidth }]}
        contentContainerStyle={styles.monthsContent}
      >
        {months.map((key) => {
          const active = key === activeMonth;
          return (
            <Pressable
              key={key}
              onPress={() => onSelectMonth(key)}
              onLayout={(e) => {
                chipLayouts.current[key] = {
                  x: e.nativeEvent.layout.x,
                  width: e.nativeEvent.layout.width,
                };
              }}
              style={[
                styles.chip,
                { width: chipWidth },
                active && { backgroundColor: theme.colors.surfaceElevated },
              ]}
            >
              <Text
                variant="labelLarge"
                numberOfLines={1}
                style={{
                  color: active ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
                  fontWeight: active ? '600' : '400',
                  textAlign: 'center',
                }}
              >
                {monthNavLabel(key)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  island: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: ISLAND_PADDING_H,
    paddingVertical: ISLAND_PADDING_V,
    gap: INNER_GAP,
  },
  backButton: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    borderRadius: BACK_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: 6,
  },
  monthsScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  monthsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CHIP_GAP,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 999,
  },
});
