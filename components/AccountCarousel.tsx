import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { formatCurrency } from '@/lib/format';
import { SCREEN_PADDING } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

export const ADD_ACCOUNT_SLIDE_ID = 'add';

export type AccountSlide = {
  id: string | null;
  name: string;
  color: string;
  balance: number;
};

export function isAddAccountSlide(slide: AccountSlide): boolean {
  return slide.id === ADD_ACCOUNT_SLIDE_ID;
}

export function accountFilterForSlide(slide: AccountSlide | undefined): string | undefined {
  if (!slide?.id || isAddAccountSlide(slide)) return undefined;
  return slide.id;
}

type Props = {
  slides: AccountSlide[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  onSlidePress?: (slide: AccountSlide) => void;
};

export function AccountCarousel({ slides, selectedIndex, onIndexChange, onSlidePress }: Props) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<AccountSlide>>(null);

  useEffect(() => {
    if (slides.length === 0) return;
    listRef.current?.scrollToIndex({ index: selectedIndex, animated: true });
  }, [selectedIndex, slides.length]);

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / width);
      if (index >= 0 && index < slides.length) {
        onIndexChange(index);
      }
    },
    [onIndexChange, slides.length, width],
  );

  const renderSlide = useCallback(
    ({ item }: { item: AccountSlide }) => {
      const isAdd = isAddAccountSlide(item);
      const balanceColor =
        item.balance > 0
          ? theme.colors.income
          : item.balance < 0
            ? theme.colors.expense
            : theme.colors.onSurface;

      return (
        <Pressable
          style={[styles.slide, { width }]}
          onPress={() => onSlidePress?.(item)}
          disabled={!onSlidePress || (item.id === null && !isAdd)}
        >
          <View style={[styles.iconWrap, { backgroundColor: `${item.color}20` }]}>
            <MaterialCommunityIcons
              name={isAdd ? 'plus' : 'wallet-outline'}
              size={32}
              color={item.color}
            />
            {item.id !== null && !isAdd ? (
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: item.color, borderColor: theme.colors.background },
                ]}
              />
            ) : null}
          </View>
          <Text variant="titleMedium" style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          {isAdd ? (
            <View style={styles.balancePlaceholder} />
          ) : (
            <Text style={[styles.balance, { color: balanceColor }]} numberOfLines={1}>
              {formatCurrency(item.balance)}
            </Text>
          )}
        </Pressable>
      );
    },
    [onSlidePress, theme.colors.background, theme.colors.expense, theme.colors.income, theme.colors.onSurface, width],
  );

  if (slides.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id ?? 'all'}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="center"
        disableIntervalMomentum
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />

      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <Pressable
              key={slide.id ?? 'all'}
              onPress={() => {
                listRef.current?.scrollToIndex({ index, animated: true });
                onIndexChange(index);
              }}
              hitSlop={8}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === selectedIndex ? theme.colors.primary : theme.colors.outlineVariant,
                  width: index === selectedIndex ? 18 : 6,
                },
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: -SCREEN_PADDING,
    marginBottom: 8,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  name: {
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  balance: {
    fontSize: 36,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  balancePlaceholder: {
    height: 43,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
