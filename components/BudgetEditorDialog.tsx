import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { FormPopup } from '@/components/FormPopup';
import { PopupSheet } from '@/components/PopupSheet';
import { useApp } from '@/lib/context/AppContext';
import {
  getBudgetsForMonth,
  getParentCategories,
  upsertBudget,
} from '@/lib/db/queries';
import type { Category } from '@/lib/db/schema';
import { popupStyles } from '@/lib/popupStyles';

type Props = {
  visible: boolean;
  year: number;
  month: number;
  onDismiss: () => void;
};

export function BudgetEditorDialog({ visible, year, month, onDismiss }: Props) {
  const { refresh } = useApp();
  const [contentKey, setContentKey] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setContentKey((k) => k + 1);
    (async () => {
      const [parents, existing] = await Promise.all([
        getParentCategories('expense'),
        getBudgetsForMonth(year, month),
      ]);
      setCategories(parents);
      const map: Record<string, string> = {};
      for (const b of existing) {
        map[b.categoryId] = String(b.plannedAmount);
      }
      setAmounts(map);
    })();
  }, [visible, year, month]);

  const handleSave = async () => {
    setSaving(true);
    for (const cat of categories) {
      const raw = amounts[cat.id]?.trim();
      if (!raw) continue;
      const parsed = parseFloat(raw);
      if (parsed > 0) {
        await upsertBudget(cat.id, year, month, parsed);
      }
    }
    setSaving(false);
    refresh();
    onDismiss();
  };

  return (
    <FormPopup visible={visible} onClose={onDismiss} contentKey={contentKey}>
      <PopupSheet
        title="Monthly budgets"
        onCancel={onDismiss}
        onConfirm={handleSave}
        confirmLoading={saving}
      >
        <Text variant="bodySmall" style={popupStyles.hint}>
          Set planned amounts per expense category for this month.
        </Text>
        {categories.map((cat) => (
          <View key={cat.id} style={popupStyles.row}>
            <Text variant="bodyMedium" style={popupStyles.label} numberOfLines={1}>
              {cat.name}
            </Text>
            <TextInput
              value={amounts[cat.id] ?? ''}
              onChangeText={(v) => setAmounts((prev) => ({ ...prev, [cat.id]: v }))}
              keyboardType="decimal-pad"
              placeholder="0"
              dense
              style={{ width: 120 }}
              left={<TextInput.Affix text="$" />}
            />
          </View>
        ))}
      </PopupSheet>
    </FormPopup>
  );
}
