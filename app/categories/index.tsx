import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import {
  ActivityIndicator,
  Button,
  Divider,
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
import { CARD_GAP, layoutStyles, SCREEN_PADDING } from '@/lib/layout';
import { navigateToConfirm } from '@/lib/navigateConfirm';
import { useAppTheme } from '@/lib/useAppTheme';

type CategoryGroupRow = { key: string };

type CategorySection = {
  title: string;
  parent: Category;
  children: Category[];
  data: CategoryGroupRow[];
};

const AnimatedSectionList = Animated.createAnimatedComponent(
  SectionList<CategoryGroupRow, CategorySection>,
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
      parents.map(async (parent) => {
        const children = expanded[parent.id] ? await getSubcategories(parent.id) : [];
        return {
          title: parent.name,
          parent,
          children,
          data: children.length > 0 ? [{ key: `${parent.id}-children` }] : [],
        };
      }),
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
        <Button mode="outlined" onPress={() => router.push('/data')}>
          Import / export data
        </Button>
      </View>
    ),
    [theme.colors.onPrimary, theme.colors.primary, router],
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
        keyExtractor={(item) => item.key}
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
                borderColor: theme.colors.outline,
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
        renderItem={({ section }) => (
          <View
            style={[
              layoutStyles.groupedListCard,
              styles.childGroup,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
            ]}
          >
            {section.children.map((item, index) => (
              <View key={item.id}>
                <List.Item
                  title={item.name}
                  contentStyle={styles.childContent}
                  titleStyle={[styles.childTitle, { color: theme.colors.onSurface }]}
                  left={(props) => (
                    <List.Icon {...props} icon="label" color={item.color} style={styles.childIcon} />
                  )}
                  right={() => (
                    <IconButton
                      icon="delete"
                      size={18}
                      style={styles.actionBtn}
                      onPress={() => confirmDelete(item)}
                    />
                  )}
                />
                {index < section.children.length - 1 ? (
                  <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />
                ) : null}
              </View>
            ))}
          </View>
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
  addWrap: { paddingBottom: SCREEN_PADDING, gap: CARD_GAP },
  parentRow: {
    borderWidth: 1,
    borderRadius: layoutStyles.card.borderRadius,
    marginBottom: CARD_GAP,
  },
  parentContent: {
    paddingLeft: SCREEN_PADDING,
    paddingRight: 8,
    paddingVertical: 8,
  },
  childGroup: {
    marginBottom: CARD_GAP,
  },
  childContent: {
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
  },
  childTitle: {
    fontSize: 14,
    lineHeight: 20,
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
