import React, { useEffect, useState } from 'react';
import { Text, TextInput } from 'react-native-paper';
import { FormFieldGroup } from '@/components/FormFieldGroup';
import { FormScreen } from '@/components/FormScreen';
import { FormTextInput } from '@/components/FormTextInput';
import { useApp } from '@/lib/context/AppContext';
import {
  getBudgetsForMonth,
  getParentCategories,
  upsertBudget,
} from '@/lib/db/queries';
import type { Category } from '@/lib/db/schema';
import { popupStyles } from '@/lib/popupStyles';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  year: number;
  month: number;
  onClose: () => void;
};

export function BudgetEditorForm({ year, month, onClose }: Props) {
  const { refresh } = useApp();
  const theme = useAppTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
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
  }, [year, month]);

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
    onClose();
  };

  return (
    <FormScreen
      title="Monthly budgets"
      onCancel={onClose}
      onConfirm={handleSave}
      confirmLoading={saving}
    >
      <Text variant="bodySmall" style={[popupStyles.hint, { color: theme.colors.onSurfaceVariant }]}>
        Set planned amounts per expense category for this month.
      </Text>
      <FormFieldGroup>
        {categories.map((cat) => (
          <FormTextInput
            key={cat.id}
            label={cat.name}
            value={amounts[cat.id] ?? ''}
            onChangeText={(v) => setAmounts((prev) => ({ ...prev, [cat.id]: v }))}
            keyboardType="decimal-pad"
            placeholder="0"
            left={<TextInput.Affix text="$" />}
          />
        ))}
      </FormFieldGroup>
    </FormScreen>
  );
}
