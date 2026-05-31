import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import type { TransactionType } from '@/lib/db/schema';
import { formatTransactionType } from '@/lib/format';
import { useTransactionTheme } from '@/lib/useAppTheme';

type Props = {
  type: TransactionType;
  selected: boolean;
  onPress: () => void;
};

export function TransactionTypeChip({ type, selected, onPress }: Props) {
  const colors = useTransactionTheme(type);

  return (
    <Chip
      selected={selected}
      onPress={onPress}
      showSelectedCheck={false}
      showSelectedOverlay={false}
      style={[
        styles.chip,
        {
          backgroundColor: 'transparent',
          borderColor: selected ? colors.main : colors.main + '55',
        },
      ]}
      textStyle={{
        color: colors.main,
        fontWeight: selected ? '700' : '500',
        textTransform: 'capitalize',
      }}
    >
      {formatTransactionType(type)}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1.5 },
});
