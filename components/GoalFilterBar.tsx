import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';
import type { Goal } from '@/lib/db/schema';
import { CARD_GAP } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

export type GoalListFilter = 'all' | 'active' | 'completed';

type Props = {
  value: GoalListFilter;
  onChange: (value: GoalListFilter) => void;
  showArchived: boolean;
  onToggleArchived: () => void;
  archivedCount: number;
};

export function GoalFilterBar({
  value,
  onChange,
  showArchived,
  onToggleArchived,
  archivedCount,
}: Props) {
  const theme = useAppTheme();
  const options: { value: GoalListFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <View style={styles.row}>
      <View style={styles.chips}>
        {options.map((opt) => (
          <Chip
            key={opt.value}
            selected={value === opt.value}
            onPress={() => onChange(opt.value)}
            showSelectedCheck={false}
            style={value === opt.value ? { backgroundColor: theme.colors.primaryContainer } : undefined}
          >
            {opt.label}
          </Chip>
        ))}
      </View>
      {archivedCount > 0 ? (
        <Chip
          selected={showArchived}
          onPress={onToggleArchived}
          showSelectedCheck={false}
          compact
          icon={showArchived ? 'eye-off-outline' : 'archive-outline'}
        >
          {showArchived ? 'Hide archived' : `Archived (${archivedCount})`}
        </Chip>
      ) : null}
    </View>
  );
}

export function matchesGoalFilter(
  goal: Goal,
  filter: GoalListFilter,
  showArchived: boolean,
): boolean {
  if (goal.status === 'archived') return showArchived;
  if (filter === 'all') return true;
  if (filter === 'active') return goal.status === 'active';
  return goal.status === 'completed';
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    marginBottom: CARD_GAP,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
