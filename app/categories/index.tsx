import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import {
  ActivityIndicator,
  Button,
  IconButton,
  List,
  Text,
} from 'react-native-paper';
import { AddCategoryForm } from '@/components/AddCategoryForm';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { ConfirmPopup } from '@/components/ConfirmPopup';
import { FormPopup } from '@/components/FormPopup';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import { useApp } from '@/lib/context/AppContext';
import {
  countTransactionsForCategory,
  deleteCategory,
  getParentCategories,
  getSubcategories,
} from '@/lib/db/queries';
import type { Category } from '@/lib/db/schema';
import { BORDER_RADIUS, layoutStyles, SCREEN_PADDING } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

type CategorySection = { title: string; data: Category[]; parent: Category };

const AnimatedSectionList = Animated.createAnimatedComponent(
  SectionList<Category, CategorySection>,
);

export default function CategoriesScreen() {
  const router = useRouter();
  const { ready, refresh } = useApp();
  const theme = useAppTheme();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyleNoFab } = useCollapsibleHeader();
  const [sections, setSections] = useState<CategorySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogMode, setDialogMode] = useState<'parent' | 'child'>('parent');
  const [parentForChild, setParentForChild] = useState<Category | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const parents = await getParentCategories();
    const built: CategorySection[] = await Promise.all(
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
    setFormKey((k) => k + 1);
    setDialogVisible(true);
  };

  const openAddChild = (parent: Category) => {
    setDialogMode('child');
    setParentForChild(parent);
    setFormKey((k) => k + 1);
    setDialogVisible(true);
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

  const listHeader = useMemo(
    () => (
      <View style={styles.addWrap}>
        <Button
          mode="contained"
          onPress={openAddParent}
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}
        >
          Add category
        </Button>
      </View>
    ),
    [theme.colors.onPrimary, theme.colors.primary],
  );

  if (!ready || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={layoutStyles.screen}>
      <CollapsibleScreenHeader
        title="Categories"
        scrollY={scrollY}
        headerHeight={headerHeight}
        leftAction="back"
        onLeftPress={() => router.back()}
      />
      <AnimatedSectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={scrollContentStyleNoFab}
        ListHeaderComponent={listHeader}
        style={{ backgroundColor: theme.colors.background }}
        renderSectionHeader={({ section }) => (
          <List.Item
            title={section.parent.name}
            description={section.parent.type}
            style={[
              styles.parentRow,
              {
                backgroundColor: theme.colors.surface,
                borderColor: section.parent.color,
              },
            ]}
            contentStyle={styles.parentContent}
            titleStyle={{ color: theme.colors.onSurface }}
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            left={(props) => <List.Icon {...props} icon="folder" color={section.parent.color} />}
            right={() => (
              <View style={styles.actionRow}>
                <IconButton
                  icon="plus"
                  size={20}
                  style={styles.actionBtn}
                  onPress={() => openAddChild(section.parent)}
                />
                <IconButton
                  icon={expanded[section.parent.id] ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  style={styles.actionBtn}
                  onPress={() => toggleExpand(section.parent.id)}
                />
                <IconButton
                  icon="delete"
                  size={20}
                  style={styles.actionBtn}
                  onPress={() => {
                    setDeleteTarget(section.parent);
                    setDeleteError('');
                  }}
                />
              </View>
            )}
          />
        )}
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            style={[styles.child, { backgroundColor: theme.colors.surfaceElevated }]}
            contentStyle={styles.childContent}
            titleStyle={[styles.childTitle, { color: theme.colors.onSurface }]}
            left={(props) => <List.Icon {...props} icon="label" color={item.color} style={styles.childIcon} />}
            right={() => (
              <IconButton
                icon="delete"
                size={18}
                style={styles.actionBtn}
                onPress={() => {
                  setDeleteTarget(item);
                  setDeleteError('');
                }}
              />
            )}
          />
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}>No categories yet.</Text>
        }
      />

      <FormPopup visible={dialogVisible} onClose={() => setDialogVisible(false)} contentKey={formKey}>
        <AddCategoryForm
          mode={dialogMode}
          parent={parentForChild}
          onClose={() => setDialogVisible(false)}
          onCreated={() => {
            setDialogVisible(false);
            load();
          }}
        />
      </FormPopup>

      <ConfirmPopup
        visible={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError('');
        }}
        title={deleteTarget ? `Delete ${deleteTarget.name}?` : 'Delete category?'}
        message={deleteError || 'This cannot be undone.'}
        onConfirm={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addWrap: { paddingBottom: SCREEN_PADDING },
  parentRow: {
    borderWidth: 1,
    borderRadius: BORDER_RADIUS,
    marginBottom: 8,
  },
  parentContent: {
    paddingLeft: SCREEN_PADDING,
    paddingRight: 8,
    paddingVertical: 4,
  },
  child: {
    marginLeft: SCREEN_PADDING,
    marginRight: 0,
    marginBottom: 4,
    borderRadius: BORDER_RADIUS,
    minHeight: 40,
  },
  childContent: {
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 0,
  },
  childTitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  childIcon: {
    marginLeft: 0,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: -6,
  },
  actionBtn: {
    margin: 0,
    width: 32,
    height: 32,
  },
  empty: { textAlign: 'center', padding: 24 },
});
