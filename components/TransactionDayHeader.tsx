import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { formatSignedCurrency } from '@/lib/format';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  title: string;
  total?: number;
};

export function TransactionDayHeader({ title, total }: Props) {
  const theme = useAppTheme();

  return (
    <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
      <Text variant="titleSmall" style={styles.title}>
        {title}
      </Text>
      {total !== undefined ? (
        <Text
          variant="titleSmall"
          style={[
            styles.total,
            {
              color:
                total > 0
                  ? theme.colors.income
                  : total < 0
                    ? theme.colors.expense
                    : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {formatSignedCurrency(total)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: { fontWeight: '600' },
  total: { fontWeight: '600', fontVariant: ['tabular-nums'] },
});
