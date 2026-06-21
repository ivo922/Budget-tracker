import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { CollapsibleScreenHeader } from '@/components/CollapsibleScreenHeader';
import { useCollapsibleHeader } from '@/hooks/useCollapsibleHeader';
import { useApp } from '@/lib/context/AppContext';
import { formatImportSummary } from '@/lib/dataTransfer/formatSummary';
import { exportAndShareBackup } from '@/lib/dataTransfer/share.native';
import { importBackupJson } from '@/lib/db/queries';
import { CARD_GAP, layoutStyles, SCREEN_PADDING } from '@/lib/layout';
import { useAppTheme } from '@/lib/useAppTheme';

export default function DataScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { ready, refresh } = useApp();
  const { scrollY, scrollHandler, headerHeight, scrollContentStyleNoFab } = useCollapsibleHeader();
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  const handleExport = async () => {
    setBusy('export');
    try {
      await exportAndShareBackup();
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(null);
    }
  };

  const runImport = async (raw: string) => {
    setBusy('import');
    try {
      const summary = await importBackupJson(raw);
      refresh();
      Alert.alert('Import complete', formatImportSummary(summary));
    } catch (error) {
      Alert.alert('Import failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(null);
    }
  };

  const handleImport = () => {
    Alert.alert(
      'Import data',
      'Merges with existing data. When the same record exists on both sides, the newer one wins. Categories and existing settings are kept as-is on conflict.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose file',
          onPress: async () => {
            const result = await DocumentPicker.getDocumentAsync({
              type: 'application/json',
              copyToCacheDirectory: true,
            });
            if (result.canceled || !result.assets[0]) return;
            const raw = await new File(result.assets[0]).text();
            await runImport(raw);
          },
        },
      ],
    );
  };

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={layoutStyles.screen}>
      <CollapsibleScreenHeader
        title="Data"
        scrollY={scrollY}
        headerHeight={headerHeight}
        leftAction="back"
        onLeftPress={() => router.back()}
      />
      <ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[scrollContentStyleNoFab, styles.content]}
        style={{ backgroundColor: theme.colors.background }}
      >
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: CARD_GAP }}>
          Export a JSON backup or import one to merge records across devices. Deletions are not synced.
        </Text>
        <Button
          mode="contained"
          icon="export"
          onPress={handleExport}
          loading={busy === 'export'}
          disabled={busy != null}
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}
          style={styles.button}
        >
          Export data
        </Button>
        <Button
          mode="outlined"
          icon="import"
          onPress={handleImport}
          loading={busy === 'import'}
          disabled={busy != null}
          style={styles.button}
        >
          Import data
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: SCREEN_PADDING, gap: CARD_GAP },
  button: { marginBottom: CARD_GAP },
});
