import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { AddCategoryForm } from '@/components/AddCategoryForm';
import { getCategoryById } from '@/lib/db/queries';
import type { Category } from '@/lib/db/schema';
import { layoutStyles } from '@/lib/layout';

export default function AddCategoryScreen() {
  const router = useRouter();
  const { mode, parentId } = useLocalSearchParams<{ mode?: string; parentId?: string }>();
  const resolvedMode = mode === 'child' ? 'child' : 'parent';
  const [parent, setParent] = useState<Category | null>(null);
  const [loading, setLoading] = useState(resolvedMode === 'child' && !!parentId);

  useEffect(() => {
    if (resolvedMode !== 'child' || !parentId) {
      setLoading(false);
      return;
    }
    getCategoryById(parentId).then((row) => {
      setParent(row ?? null);
      setLoading(false);
    });
  }, [resolvedMode, parentId]);

  if (loading) {
    return (
      <View style={[layoutStyles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AddCategoryForm
      mode={resolvedMode}
      parent={parent}
      onClose={() => router.back()}
      onCreated={() => router.back()}
    />
  );
}
