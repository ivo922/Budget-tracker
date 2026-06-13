import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { IconButton, ProgressBar, Text, TextInput } from 'react-native-paper';
import { FormScreen } from '@/components/FormScreen';
import { FormTextInput } from '@/components/FormTextInput';
import { useApp } from '@/lib/context/AppContext';
import {
  deleteBudgetForCategory,
  getBudgetVsActual,
  getParentCategories,
  upsertBudget,
} from '@/lib/db/queries';
import type { Category } from '@/lib/db/schema';
import { formatCurrency } from '@/lib/format';
import { BORDER_RADIUS } from '@/lib/layout';
import { formatBudgetMonth, getCalendarMonthRange } from '@/lib/periods';
import { popupStyles } from '@/lib/popupStyles';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  year: number;
  month: number;
  focusCategoryId?: string;
  onClose: () => void;
};

export function BudgetEditorForm({ year, month, focusCategoryId, onClose }: Props) {
  const { refresh } = useApp();
  const theme = useAppTheme();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const rowOffsets = useRef<Record<string, number>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [spentByCategory, setSpentByCategory] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState(false);

  const monthLabel = formatBudgetMonth(year, month);
  const monthRange = getCalendarMonthRange(year, month);

  useEffect(() => {
    (async () => {
      const [parents, summary] = await Promise.all([
        getParentCategories('expense'),
        getBudgetVsActual(year, month, monthRange.start, monthRange.end),
      ]);
      setCategories(parents);
      const map: Record<string, string> = {};
      const spent: Record<string, number> = {};
      for (const item of summary.items) {
        map[item.categoryId] = String(item.planned);
        spent[item.categoryId] = item.spent;
      }
      setAmounts(map);
      setSpentByCategory(spent);
    })();
  }, [month, monthRange.end, monthRange.start, year]);

  useEffect(() => {
    if (!focusCategoryId || focused || categories.length === 0) return;
    const y = rowOffsets.current[focusCategoryId];
    if (y == null) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
    setFocused(true);
  }, [categories.length, focusCategoryId, focused]);

  const handleSave = async () => {
    setSaving(true);
    for (const cat of categories) {
      const raw = amounts[cat.id]?.trim();
      if (!raw) {
        await deleteBudgetForCategory(cat.id, year, month);
        continue;
      }
      const parsed = parseFloat(raw);
      if (Number.isNaN(parsed) || parsed <= 0) {
        await deleteBudgetForCategory(cat.id, year, month);
        continue;
      }
      await upsertBudget(cat.id, year, month, parsed);
    }
    setSaving(false);
    refresh();
    onClose();
  };

  const clearCategory = (categoryId: string) => {
    setAmounts((prev) => ({ ...prev, [categoryId]: '' }));
  };

  return (
    <FormScreen
      title={`${monthLabel} budgets`}
      onCancel={onClose}
      onConfirm={handleSave}
      confirmLoading={saving}
      scrollRef={scrollRef}
    >
      <Text variant="bodySmall" style={[popupStyles.hint, { color: theme.colors.onSurfaceVariant }]}>
        Set planned amounts per expense category. Clear a field to remove its budget.
      </Text>

      <View style={styles.list}>
        {categories.map((cat) => {
          const spent = spentByCategory[cat.id] ?? 0;
          const plannedRaw = amounts[cat.id]?.trim();
          const planned = plannedRaw ? parseFloat(plannedRaw) : 0;
          const hasPlanned = !Number.isNaN(planned) && planned > 0;
          const remaining = hasPlanned ? planned - spent : 0;
          const overBudget = hasPlanned && spent > planned;
          const progress = hasPlanned ? Math.min(1, spent / planned) : 0;
          const percent = hasPlanned ? Math.round((spent / planned) * 100) : 0;

          return (
            <View
              key={cat.id}
              onLayout={(event) => {
                rowOffsets.current[cat.id] = event.nativeEvent.layout.y;
              }}
              style={[
                styles.row,
                {
                  backgroundColor:
                    focusCategoryId === cat.id
                      ? theme.colors.surfaceElevated
                      : theme.colors.surface,
                  borderColor: theme.colors.outline,
                },
              ]}
            >
              <View style={styles.rowHeader}>
                <View style={styles.nameWrap}>
                  <View style={[styles.dot, { backgroundColor: cat.color }]} />
                  <Text variant="titleSmall" style={styles.name} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </View>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Spent {formatCurrency(spent)}
                </Text>
              </View>

              <View style={styles.inputRow}>
                <FormTextInput
                  label="Planned"
                  value={amounts[cat.id] ?? ''}
                  onChangeText={(v) => setAmounts((prev) => ({ ...prev, [cat.id]: v }))}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  left={<TextInput.Affix text="$" />}
                  style={styles.input}
                />
                {amounts[cat.id] ? (
                  <IconButton
                    icon="close-circle-outline"
                    size={20}
                    onPress={() => clearCategory(cat.id)}
                    accessibilityLabel={`Clear ${cat.name} budget`}
                  />
                ) : null}
              </View>

              {hasPlanned ? (
                <>
                  <ProgressBar
                    progress={progress}
                    color={overBudget ? theme.colors.expense : theme.colors.income}
                    style={styles.bar}
                  />
                  <Text
                    variant="bodySmall"
                    style={{
                      color: overBudget ? theme.colors.expense : theme.colors.onSurfaceVariant,
                    }}
                  >
                    {overBudget
                      ? `${formatCurrency(Math.abs(remaining))} over · ${percent}%`
                      : `${formatCurrency(remaining)} left · ${percent}%`}
                  </Text>
                </>
              ) : (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  No budget set
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {categories.length === 0 ? (
        <Pressable onPress={onClose}>
          <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
            Add expense categories first
          </Text>
        </Pressable>
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  row: {
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  nameWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    flex: 1,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  input: {
    flex: 1,
  },
  bar: {
    height: 6,
    borderRadius: BORDER_RADIUS,
  },
});
