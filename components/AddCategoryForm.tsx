import React, { useState } from 'react';
import { FormFieldGroup } from '@/components/FormFieldGroup';
import { FormScreen } from '@/components/FormScreen';
import { FormTextInput } from '@/components/FormTextInput';
import { TransactionTypeSelector } from '@/components/TransactionTypeSelector';
import { useApp } from '@/lib/context/AppContext';
import { createCategory, getParentCategories } from '@/lib/db/queries';
import type { Category, CategoryType } from '@/lib/db/schema';
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
    <FormScreen
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
      <FormFieldGroup>
        <FormTextInput label="Name" value={name} onChangeText={setName} />
      </FormFieldGroup>
    </FormScreen>
  );
}
