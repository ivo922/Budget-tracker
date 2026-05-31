import React, { useState } from 'react';
import { TextInput } from 'react-native-paper';
import { PopupSheet } from '@/components/PopupSheet';
import { TransactionTypeSelector } from '@/components/TransactionTypeSelector';
import { useApp } from '@/lib/context/AppContext';
import { createCategory, getParentCategories } from '@/lib/db/queries';
import type { Category, CategoryType } from '@/lib/db/schema';
import { popupStyles } from '@/lib/popupStyles';
import { useAppTheme } from '@/lib/useAppTheme';

type Props = {
  mode: 'parent' | 'child';
  parent?: Category | null;
  onClose: () => void;
  onCreated?: () => void;
};

export function AddCategoryForm({ mode, parent, onClose, onCreated }: Props) {
  const { refresh } = useApp();
  const theme = useAppTheme();
  const [name, setName] = useState('');
  const [catType, setCatType] = useState<CategoryType>(parent?.type ?? 'expense');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const allParents = await getParentCategories(catType);
    await createCategory({
      name: name.trim(),
      type: catType,
      color: parent?.color ?? (catType === 'income' ? theme.colors.income : theme.colors.expense),
      parentId: parent?.id ?? null,
      sortOrder: allParents.length + 1,
    });
    setSaving(false);
    refresh();
    onCreated?.();
    onClose();
  };

  return (
    <PopupSheet
      title={mode === 'parent' ? 'New category' : `Subcategory of ${parent?.name}`}
      onCancel={onClose}
      onConfirm={handleCreate}
      confirmLabel="Create"
      confirmLoading={saving}
    >
      {mode === 'parent' ? (
        <TransactionTypeSelector
          value={catType}
          onChange={(t) => setCatType(t as CategoryType)}
          types={['expense', 'income']}
        />
      ) : null}
      <TextInput label="Name" value={name} onChangeText={setName} style={popupStyles.input} />
    </PopupSheet>
  );
}
