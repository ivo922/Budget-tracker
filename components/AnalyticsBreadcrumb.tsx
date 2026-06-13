import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '@/lib/useAppTheme';

export type BreadcrumbSegment = {
  id: string;
  label: string;
};

type Props = {
  segments: BreadcrumbSegment[];
  onPress: (index: number) => void;
};

export function AnalyticsBreadcrumb({ segments, onPress }: Props) {
  const theme = useAppTheme();

  if (segments.length <= 1) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        return (
          <Pressable
            key={segment.id}
            onPress={() => !isLast && onPress(index)}
            disabled={isLast}
            style={styles.segment}
          >
            <Text
              variant="labelLarge"
              style={{
                color: isLast ? theme.colors.onSurface : theme.colors.primary,
                fontWeight: isLast ? '600' : '500',
              }}
            >
              {segment.label}
            </Text>
            {!isLast ? (
              <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                {' '}
                ›{' '}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  segment: { flexDirection: 'row', alignItems: 'center' },
});
