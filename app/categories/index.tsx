import { useFocusEffect, useRouter } from 'expo-router';
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
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import { useApp } from '@/lib/context/AppContext';
import {
  getParentCategories,
  getSubcategories,
} from '@/lib/db/queries';
import type { Category } from '@/lib/db/schema';
import { BORDER_RADIUS, layoutStyles, SCREEN_PADDING } from '@/lib/layout';
import { navigateToConfirm } from '@/lib/navigateConfirm';
import { useAppTheme } from '@/lib/useAppTheme';

type CategorySection = { title: string; data: Category[]; parent: Category };

const AnimatedSectionList = Animated.createAnimatedComponent(
  SectionList<Category, CategorySection>,
);

export default function CategoriesScreen() {
  const router = useRouter();
  const { ready } = useApp();
  const theme = useAppTheme();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyleNoFab } = useCollapsibleHeader();
  const [sections, setSections] = useState<CategorySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

  useFocusEffect(
    useCallback(() => {
      if (ready) load();
    }, [ready, load]),
  );

  useEffect(() => {
    if (ready) load();
  }, [ready, expanded, load]);

  const openAddParent = () => {
    router.push({ pathname: '/category/add', params: { mode: 'parent' } });
  };

  const openAddChild = (parent: Category) => {
    router.push({ pathname: '/category/add', params: { mode: 'child', parentId: parent.id } });
  };

  const confirmDelete = (category: Category) => {
    navigateToConfirm(router, {
      type: 'category',
      id: category.id,
      title: `Delete ${category.name}?`,
      message: 'This cannot be undone.',
    });
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
                  onPress={() => confirmDelete(section.parent)}
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
                onPress={() => confirmDelete(item)}
              />
            )}
          />
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}>No categories yet.</Text>
        }
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
