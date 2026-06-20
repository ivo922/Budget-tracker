import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Button, Chip, Divider, Modal, Portal, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FormFieldButton } from '@/components/FormFieldButton';
import { FormFieldGroup } from '@/components/FormFieldGroup';
import { FormFieldSwitch } from '@/components/FormFieldSwitch';
import { FormSection } from '@/components/FormSection';
import { ThemedMenu, ThemedMenuItem } from '@/components/ThemedMenu';
import { TransactionTypeChip } from '@/components/TransactionTypeChip';
import { getParentCategories, getSubcategories, type TransactionFilters } from '@/lib/db/queries';
import type { Account, Category, TransactionType } from '@/lib/db/schema';
import { formatTransactionType } from '@/lib/format';
import { BORDER_RADIUS, CARD_INNER_GAP, ROW_PADDING_H, SCREEN_PADDING } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

export type TransactionFiltersValue = {
  accountId?: string;
  category?: Category;
  uncategorized: boolean;
  type?: TransactionType;
  unpaidOnly: boolean;
};

export const EMPTY_TRANSACTION_FILTERS: TransactionFiltersValue = {
  uncategorized: false,
  unpaidOnly: false,
};

type CategorySection = {
  title: string;
  type: 'income' | 'expense';
  items: Array<{ category: Category; depth: number }>;
};

type Props = {
  value: TransactionFiltersValue;
  onChange: (value: TransactionFiltersValue) => void;
  accounts: Account[];
};

export function countActiveTransactionFilters(value: TransactionFiltersValue): number {
  let count = 0;
  if (value.accountId) count += 1;
  if (value.category || value.uncategorized) count += 1;
  if (value.type) count += 1;
  if (value.unpaidOnly) count += 1;
  return count;
}

export function transactionFiltersToQuery(value: TransactionFiltersValue): TransactionFilters {
  return {
    accountId: value.accountId,
    categoryId: value.uncategorized ? undefined : value.category?.id,
    uncategorized: value.uncategorized || undefined,
    type: value.type,
    paid: value.unpaidOnly ? false : undefined,
  };
}

export function TransactionFiltersPanel({ value, onChange, accounts }: Props) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [categorySections, setCategorySections] = useState<CategorySection[]>([]);

  const activeCount = countActiveTransactionFilters(value);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [incomeParents, expenseParents] = await Promise.all([
        getParentCategories('income'),
        getParentCategories('expense'),
      ]);

      const buildSection = async (
        type: 'income' | 'expense',
        title: string,
        parents: Category[],
      ): Promise<CategorySection> => {
        const items: CategorySection['items'] = [];
        for (const parent of parents) {
          items.push({ category: parent, depth: 0 });
          const subs = await getSubcategories(parent.id);
          for (const sub of subs) {
            items.push({ category: sub, depth: 1 });
          }
        }
        return { type, title, items };
      };

      setCategorySections(
        await Promise.all([
          buildSection('income', 'Income categories', incomeParents),
          buildSection('expense', 'Expense categories', expenseParents),
        ]),
      );
    })();
  }, [open]);

  const selectedAccountName = useMemo(
    () => accounts.find((a) => a.id === value.accountId)?.name,
    [accounts, value.accountId],
  );

  const categoryLabel = useMemo(() => {
    if (value.uncategorized) return 'Uncategorized';
    if (value.category) return value.category.name;
    return undefined;
  }, [value.category, value.uncategorized]);

  const draftCategoryLabel = useMemo(() => {
    if (draft.uncategorized) return 'Uncategorized';
    if (draft.category) return draft.category.name;
    return 'All categories';
  }, [draft.category, draft.uncategorized]);

  const applyDraft = () => {
    onChange(draft);
    setOpen(false);
  };

  const clearAll = useCallback(() => {
    onChange(EMPTY_TRANSACTION_FILTERS);
    setDraft(EMPTY_TRANSACTION_FILTERS);
    setOpen(false);
  }, [onChange]);

  const removeAccount = () => onChange({ ...value, accountId: undefined });
  const removeCategory = () => onChange({ ...value, category: undefined, uncategorized: false });
  const removeType = () => onChange({ ...value, type: undefined });
  const removeUnpaid = () => onChange({ ...value, unpaidOnly: false });

  const selectCategory = (category?: Category, uncategorized = false) => {
    setDraft((prev) => ({
      ...prev,
      category: uncategorized ? undefined : category,
      uncategorized,
      type:
        uncategorized || !category
          ? prev.type
          : category.type === 'income' || category.type === 'expense'
            ? category.type
            : prev.type,
    }));
  };

  return (
    <View style={styles.container}>
      <Chip
        icon="filter-variant"
        onPress={() => setOpen(true)}
        showSelectedCheck={false}
        style={[
          styles.filterChip,
          activeCount > 0
            ? {
                backgroundColor: theme.colors.primaryContainer,
                borderColor: theme.colors.primary,
              }
            : { borderColor: theme.colors.outline },
        ]}
        textStyle={{
          color: activeCount > 0 ? theme.colors.primary : theme.colors.onSurface,
          fontWeight: activeCount > 0 ? '700' : '500',
        }}
      >
        Filters{activeCount > 0 ? ` (${activeCount})` : ''}
      </Chip>

      {selectedAccountName ? (
        <Chip
          icon="wallet-outline"
          onClose={removeAccount}
          showSelectedCheck={false}
          style={[styles.activeChip, { borderColor: theme.colors.outline }]}
        >
          {selectedAccountName}
        </Chip>
      ) : null}

      {categoryLabel ? (
        <Chip
          icon="tag-outline"
          onClose={removeCategory}
          showSelectedCheck={false}
          style={[
            styles.activeChip,
            {
              backgroundColor: theme.colors.primaryContainer,
              borderColor: theme.colors.primary,
            },
          ]}
          textStyle={{ color: theme.colors.primary, fontWeight: '600' }}
        >
          {categoryLabel}
        </Chip>
      ) : null}

      {value.type ? (
        <Chip
          onClose={removeType}
          showSelectedCheck={false}
          style={[styles.activeChip, { borderColor: theme.colors.outline }]}
        >
          {formatTransactionType(value.type)}
        </Chip>
      ) : null}

      {value.unpaidOnly ? (
        <Chip
          icon="clock-outline"
          onClose={removeUnpaid}
          showSelectedCheck={false}
          style={[
            styles.activeChip,
            {
              backgroundColor: theme.colors.primaryContainer,
              borderColor: theme.colors.primary,
            },
          ]}
          textStyle={{ color: theme.colors.primary, fontWeight: '600' }}
        >
          Unpaid
        </Chip>
      ) : null}

      <Portal>
        <Modal
          visible={open}
          onDismiss={() => setOpen(false)}
          contentContainerStyle={[
            styles.modal,
            {
              backgroundColor: theme.colors.surface,
              marginTop: insets.top + SCREEN_PADDING,
              marginBottom: insets.bottom + SCREEN_PADDING,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              Filters
            </Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={12}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurface} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text variant="labelLarge" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
              Account
            </Text>
            <FormFieldGroup>
              <ThemedMenu
                visible={accountMenuOpen}
                onDismiss={() => setAccountMenuOpen(false)}
                anchor={
                  <FormFieldButton
                    label="Account"
                    value={
                      draft.accountId
                        ? accounts.find((a) => a.id === draft.accountId)?.name ?? 'Account'
                        : 'All accounts'
                    }
                    onPress={() => setAccountMenuOpen(true)}
                    icon={accountMenuOpen ? 'chevron-up' : 'chevron-down'}
                  />
                }
              >
                <ThemedMenuItem
                  title="All accounts"
                  titleStyle={!draft.accountId ? { color: theme.colors.primary, fontWeight: '600' } : undefined}
                  onPress={() => {
                    setDraft((prev) => ({ ...prev, accountId: undefined }));
                    setAccountMenuOpen(false);
                  }}
                />
                {accounts.map((account) => (
                  <ThemedMenuItem
                    key={account.id}
                    title={account.name}
                    titleStyle={
                      draft.accountId === account.id
                        ? { color: theme.colors.primary, fontWeight: '600' }
                        : undefined
                    }
                    onPress={() => {
                      setDraft((prev) => ({ ...prev, accountId: account.id }));
                      setAccountMenuOpen(false);
                    }}
                  />
                ))}
              </ThemedMenu>
            </FormFieldGroup>

            <Text variant="labelLarge" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
              Category
            </Text>
            <FormFieldGroup>
              <Pressable
                onPress={() => selectCategory(undefined, false)}
                style={({ pressed }) => [
                  styles.categoryRow,
                  {
                    backgroundColor:
                      pressed || (!draft.category && !draft.uncategorized)
                        ? theme.colors.surfaceElevated
                        : 'transparent',
                  },
                ]}
              >
                <Text
                  variant="bodyLarge"
                  style={{
                    fontWeight: !draft.category && !draft.uncategorized ? '700' : '400',
                    color:
                      !draft.category && !draft.uncategorized
                        ? theme.colors.primary
                        : theme.colors.onSurface,
                  }}
                >
                  All categories
                </Text>
              </Pressable>
              <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />
              <Pressable
                onPress={() => selectCategory(undefined, true)}
                style={({ pressed }) => [
                  styles.categoryRow,
                  {
                    backgroundColor:
                      pressed || draft.uncategorized ? theme.colors.surfaceElevated : 'transparent',
                  },
                ]}
              >
                <Text
                  variant="bodyLarge"
                  style={{
                    fontWeight: draft.uncategorized ? '700' : '400',
                    color: draft.uncategorized ? theme.colors.primary : theme.colors.onSurface,
                  }}
                >
                  Uncategorized
                </Text>
              </Pressable>
              {categorySections.map((section) => (
                <View key={section.type}>
                  <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />
                  <Text
                    variant="labelMedium"
                    style={[styles.categorySectionTitle, { color: theme.colors.onSurfaceVariant }]}
                  >
                    {section.title}
                  </Text>
                  {section.items.map(({ category, depth }) => {
                    const selected = draft.category?.id === category.id;
                    return (
                      <Pressable
                        key={category.id}
                        onPress={() => selectCategory(category)}
                        style={({ pressed }) => [
                          styles.categoryRow,
                          {
                            paddingLeft: ROW_PADDING_H + depth * 16,
                            backgroundColor:
                              pressed || selected ? theme.colors.surfaceElevated : 'transparent',
                          },
                        ]}
                      >
                        <View style={styles.categoryNameRow}>
                          {depth > 0 ? (
                            <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                          ) : null}
                          <Text
                            variant="bodyLarge"
                            numberOfLines={1}
                            style={{
                              flex: 1,
                              fontWeight: selected ? '700' : '400',
                              color: selected ? theme.colors.primary : theme.colors.onSurface,
                            }}
                          >
                            {category.name}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </FormFieldGroup>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              Selected: {draftCategoryLabel}
            </Text>

            <Text variant="labelLarge" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
              Type
            </Text>
            <FormSection compact>
              <View style={styles.typeRow}>
                {(['income', 'expense', 'transfer'] as const).map((type) => (
                  <TransactionTypeChip
                    key={type}
                    type={type}
                    selected={draft.type === type}
                    onPress={() =>
                      setDraft((prev) => ({
                        ...prev,
                        type: prev.type === type ? undefined : type,
                      }))
                    }
                  />
                ))}
              </View>
            </FormSection>

            <Text variant="labelLarge" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
              Status
            </Text>
            <FormFieldGroup>
              <FormFieldSwitch
                label="Unpaid only"
                value={draft.unpaidOnly}
                onValueChange={(unpaidOnly) => setDraft((prev) => ({ ...prev, unpaidOnly }))}
              />
            </FormFieldGroup>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button mode="text" onPress={clearAll} disabled={countActiveTransactionFilters(draft) === 0}>
              Clear all
            </Button>
            <Button mode="contained" onPress={applyDraft}>
              Apply
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    borderWidth: 1.5,
  },
  activeChip: {
    borderWidth: 1,
  },
  modal: {
    marginHorizontal: SCREEN_PADDING,
    borderRadius: BORDER_RADIUS,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: SCREEN_PADDING,
    paddingBottom: CARD_INNER_GAP,
  },
  modalTitle: {
    fontWeight: '700',
  },
  modalBody: {
    paddingHorizontal: SCREEN_PADDING,
  },
  sectionLabel: {
    marginTop: CARD_INNER_GAP,
    marginBottom: 8,
    fontWeight: '600',
  },
  categoryRow: {
    paddingHorizontal: ROW_PADDING_H,
    paddingVertical: 12,
  },
  categorySectionTitle: {
    paddingHorizontal: ROW_PADDING_H,
    paddingTop: 10,
    paddingBottom: 4,
    fontWeight: '600',
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: SCREEN_PADDING,
    gap: 8,
  },
});
