import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

import type { RawGpsPoint } from '../domain/gps-filter';
import { parseGpx, type ParsedGpx } from '../domain/gpx';
import { MAX_GPX_FILE_BYTES } from '../domain/gpx-xml';

const RIDES_DIR = `${FileSystem.documentDirectory}rides/`;

export interface GpxImportDraft {
  filename: string;
  gpx: ParsedGpx;
}

export async function pickGpxImportAsync(): Promise<GpxImportDraft | null> {
  const result = await DocumentPicker.getDocumentAsync({
    // Android providers use inconsistent MIME types for GPX (often octet-stream), so keep the
    // picker permissive and validate the selected content ourselves before any permanent write.
    type: '*/*',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const info = await FileSystem.getInfoAsync(asset.uri);
  if (!info.exists) throw new Error('The selected GPX file could not be read');
  const size = asset.size ?? ('size' in info ? info.size : undefined);
  if (size != null && size > MAX_GPX_FILE_BYTES) {
    throw new Error('The selected GPX file exceeds the 10 MiB limit');
  }
  const xml = await FileSystem.readAsStringAsync(asset.uri);
  if (new TextEncoder().encode(xml).length > MAX_GPX_FILE_BYTES) {
    throw new Error('The selected GPX file exceeds the 10 MiB limit');
  }
  return { filename: asset.name, gpx: parseGpx(xml) };
}

export async function writeImportedTrackAsync(points: RawGpsPoint[]): Promise<string> {
  const info = await FileSystem.getInfoAsync(RIDES_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(RIDES_DIR, { intermediates: true });
  const uri = `${RIDES_DIR}${Crypto.randomUUID()}.ndjson`;
  const content = points.map((point) => JSON.stringify(point)).join('\n') + '\n';
  await FileSystem.writeAsStringAsync(uri, content);
  return uri;
}

export async function deleteImportedTrackAsync(uri: string): Promise<void> {
  await FileSystem.deleteAsync(uri, { idempotent: true });
}
