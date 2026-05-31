import React, { useCallback, useEffect, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Dialog,
  IconButton,
  List,
  Portal,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';
import { useApp } from '@/lib/context/AppContext';
import {
  countTransactionsForCategory,
  createCategory,
  deleteCategory,
  getParentCategories,
  getSubcategories,
} from '@/lib/db/queries';
import type { Category, CategoryType } from '@/lib/db/schema';

type Section = { title: string; data: Category[]; parent: Category };

export default function CategoriesScreen() {
  const { ready, refresh } = useApp();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMode, setDialogMode] = useState<'parent' | 'child'>('parent');
  const [parentForChild, setParentForChild] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [catType, setCatType] = useState<CategoryType>('expense');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const parents = await getParentCategories();
    const built: Section[] = await Promise.all(
      parents.map(async (parent) => ({
        title: parent.name,
        parent,
        data: expanded[parent.id] ? await getSubcategories(parent.id) : [],
      })),
    );
    setSections(built);
    setLoading(false);
  }, [expanded]);

  useEffect(() => {
    if (ready) load();
  }, [ready, expanded, load]);

  const openAddParent = () => {
    setDialogMode('parent');
    setParentForChild(null);
    setName('');
    setCatType('expense');
    setDialogVisible(true);
  };

  const openAddChild = (parent: Category) => {
    setDialogMode('child');
    setParentForChild(parent);
    setName('');
    setCatType(parent.type);
    setDialogVisible(true);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    const allParents = await getParentCategories(catType);
    await createCategory({
      name: name.trim(),
      type: catType,
      color: parentForChild?.color ?? '#6750A4',
      parentId: parentForChild?.id ?? null,
      sortOrder: allParents.length + 1,
    });
    setDialogVisible(false);
    refresh();
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const txCount = await countTransactionsForCategory(deleteTarget.id);
    if (txCount > 0) {
      setDeleteError('Cannot delete — category has transactions.');
      return;
    }
    const result = await deleteCategory(deleteTarget.id);
    if (!result.ok) {
      setDeleteError(result.reason ?? 'Cannot delete');
      return;
    }
    setDeleteTarget(null);
    setDeleteError('');
    refresh();
    load();
  };

  const toggleExpand = (parentId: string) => {
    setExpanded((prev) => ({ ...prev, [parentId]: !prev[parentId] }));
  };

  if (!ready || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Button mode="contained" onPress={openAddParent} style={styles.addBtn}>
        Add category
      </Button>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <List.Item
            title={section.parent.name}
            description={section.parent.type}
            left={() => <List.Icon icon="folder" color={section.parent.color} />}
            right={() => (
              <View style={styles.row}>
                <IconButton icon="plus" onPress={() => openAddChild(section.parent)} />
                <IconButton
                  icon={expanded[section.parent.id] ? 'chevron-up' : 'chevron-down'}
                  onPress={() => toggleExpand(section.parent.id)}
                />
                <IconButton icon="delete" onPress={() => { setDeleteTarget(section.parent); setDeleteError(''); }} />
              </View>
            )}
          />
        )}
        renderItem={({ item, section }) => (
          <List.Item
            title={item.name}
            style={styles.child}
            left={() => <List.Icon icon="label" color={item.color} />}
            right={() => (
              <IconButton icon="delete" onPress={() => { setDeleteTarget(item); setDeleteError(''); }} />
            )}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No categories yet.</Text>}
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{dialogMode === 'parent' ? 'New category' : `Subcategory of ${parentForChild?.name}`}</Dialog.Title>
          <Dialog.Content>
            {dialogMode === 'parent' && (
              <SegmentedButtons
                value={catType}
                onValueChange={(v) => setCatType(v as CategoryType)}
                buttons={[
                  { value: 'expense', label: 'Expense' },
                  { value: 'income', label: 'Income' },
                ]}
              />
            )}
            <TextInput label="Name" value={name} onChangeText={setName} style={styles.input} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCreate}>Create</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={!!deleteTarget} onDismiss={() => setDeleteTarget(null)}>
          <Dialog.Title>Delete {deleteTarget?.name}?</Dialog.Title>
          <Dialog.Content>
            {deleteError ? <Text style={styles.error}>{deleteError}</Text> : <Text>This cannot be undone.</Text>}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteTarget(null)}>Cancel</Button>
            <Button textColor="#C62828" onPress={handleDelete}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addBtn: { margin: 16 },
  child: { paddingLeft: 24 },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: { marginTop: 12 },
  empty: { textAlign: 'center', padding: 24 },
  error: { color: '#C62828' },
});
