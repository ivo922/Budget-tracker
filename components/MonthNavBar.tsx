import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { monthNavLabel } from '@/lib/groupTransactions';
import { SCREEN_PADDING } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

const INNER_PADDING_H = 6;
const CHIP_GAP = 6;

type Props = {
  months: string[];
  activeMonth: string;
  onSelectMonth: (monthKey: string) => void;
};

export function MonthNavBar({ months, activeMonth, onSelectMonth }: Props) {
  const theme = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
  const chipLayouts = useRef<Record<string, { x: number; width: number }>>({});

  useEffect(() => {
    const layout = chipLayouts.current[activeMonth];
    if (layout && scrollRef.current) {
      scrollRef.current.scrollTo({
        x: Math.max(0, layout.x - INNER_PADDING_H),
        animated: true,
      });
    }
  }, [activeMonth]);

  return (
    <View style={styles.outer}>
      <View style={[styles.pill, { backgroundColor: theme.colors.surface }]}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.content}
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
                  active && { backgroundColor: theme.colors.surfaceElevated },
                ]}
              >
                <Text
                  variant="labelLarge"
                  style={{
                    color: active ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
                    fontWeight: active ? '600' : '400',
                  }}
                >
                  {monthNavLabel(key)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: 8,
  },
  pill: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: INNER_PADDING_H,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: CHIP_GAP,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
});
