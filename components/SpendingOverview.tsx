import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Divider, SegmentedButtons, Text } from 'react-native-paper';
import { CategorySpendingRow, SpendingDonut } from '@/components/CategorySpendingRow';
import type { BudgetVsActualItem, CategorySpending } from '@/lib/db/queries';
import { CARD_PADDING, CARD_GAP, layoutStyles, SECTION_GAP } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

export type CategoryViewMode = 'expense' | 'income';

type Props = {
  mode: CategoryViewMode;
  onModeChange: (mode: CategoryViewMode) => void;
  data: CategorySpending[];
  showDonut?: boolean;
  budgetItems?: BudgetVsActualItem[];
  onCategoryPress?: (item: CategorySpending) => void;
  onBudgetPress?: (categoryId: string) => void;
};

export function SpendingOverview({
  mode,
  onModeChange,
  data,
  showDonut = true,
  budgetItems,
  onCategoryPress,
  onBudgetPress,
}: Props) {
  const theme = useAppTheme();
  const total = data.reduce((sum, item) => sum + item.total, 0);
  const budgetMap = new Map((budgetItems ?? []).map((item) => [item.categoryId, item]));
  const emptyCopy =
    mode === 'income' ? 'No income recorded this period.' : 'No spending data for this period.';

  return (
    <View style={styles.wrapper}>
      <SegmentedButtons
        value={mode}
        onValueChange={(value) => onModeChange(value as CategoryViewMode)}
        buttons={[
          { value: 'expense', label: 'Expenses' },
          { value: 'income', label: 'Income' },
        ]}
        style={styles.segmented}
      />

      {data.length === 0 ? (
        <View
          style={[
            styles.empty,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
          ]}
        >
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {emptyCopy}
          </Text>
        </View>
      ) : (
        <>
          {showDonut ? (
            <SpendingDonut
              data={data}
              totalLabel={mode === 'income' ? 'Income' : 'Spent'}
              onSlicePress={onCategoryPress}
            />
          ) : null}

          <View
            style={[
              layoutStyles.groupedListCard,
              styles.list,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
            ]}
          >
            {data.map((item, index) => (
              <View key={item.categoryId}>
                <CategorySpendingRow
                  item={item}
                  total={total}
                  grouped
                  budget={mode === 'expense' ? budgetMap.get(item.categoryId) : undefined}
                  onPress={onCategoryPress ? () => onCategoryPress(item) : undefined}
                  onBudgetPress={
                    onBudgetPress ? () => onBudgetPress(item.categoryId) : undefined
                  }
                />
                {index < data.length - 1 ? (
                  <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />
                ) : null}
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: SECTION_GAP },
  segmented: {},
  empty: {
    borderWidth: 1,
    borderRadius: layoutStyles.card.borderRadius,
    padding: CARD_PADDING,
    alignItems: 'center',
  },
  list: { marginBottom: 0 },
});
