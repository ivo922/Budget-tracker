import React, { type ReactNode } from 'react';
import { View } from 'react-native';
import { CARD_INNER_GAP, layoutStyles } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  children: ReactNode;
  compact?: boolean;
};

export function FormSection({ children, compact = false }: Props) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        compact ? [layoutStyles.formGroup, styles.compact] : layoutStyles.formSection,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = {
  compact: { padding: CARD_INNER_GAP },
};
