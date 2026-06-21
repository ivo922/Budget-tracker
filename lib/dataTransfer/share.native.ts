import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { buildBackup, serializeBackup } from './export';

export async function exportAndShareBackup(): Promise<void> {
  const backup = await buildBackup();
  const json = serializeBackup(backup);
  const filename = `budget-tracker-${backup.exportedAt.slice(0, 10)}.json`;
  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  file.write(json);
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export budget data',
  });
}
