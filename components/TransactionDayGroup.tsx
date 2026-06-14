import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Divider } from 'react-native-paper';
import { TransactionDayHeader } from '@/components/TransactionDayHeader';
import { TransactionRow } from '@/components/TransactionRow';
import type { TransactionDaySection, TransactionListItem } from '@/components/TransactionGroupedList';
import { BORDER_RADIUS } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  section: TransactionDaySection;
  onPressItem: (id: string) => void;
  onPressGoal?: (goalId: string) => void;
  showDayTotal?: boolean;
};

export function TransactionDayGroup({ section, onPressItem, onPressGoal, showDayTotal = true }: Props) {
  const theme = useAppTheme();

  return (
    <View>
      <TransactionDayHeader
        title={section.title}
        total={showDayTotal ? section.total : undefined}
      />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        {section.data.map((item, index) => (
          <TransactionDayGroupRow
            key={item.tx.id}
            item={item}
            isLast={index === section.data.length - 1}
            onPress={() => onPressItem(item.tx.id)}
            onPressGoal={onPressGoal}
          />
        ))}
      </View>
    </View>
  );
}

function TransactionDayGroupRow({
  item,
  isLast,
  onPress,
  onPressGoal,
}: {
  item: TransactionListItem;
  isLast: boolean;
  onPress: () => void;
  onPressGoal?: (goalId: string) => void;
}) {
  const theme = useAppTheme();

  return (
    <View>
      <TransactionRow
        transaction={item.tx}
        account={item.account}
        category={item.category}
        fromAccount={item.fromAccount}
        toAccount={item.toAccount}
        goalName={item.goalName}
        goalId={item.goalId}
        onPress={onPress}
        onPressGoal={onPressGoal}
      />
      {!isLast ? <Divider style={{ backgroundColor: theme.colors.outlineVariant }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    marginBottom: 12,
  },
});
