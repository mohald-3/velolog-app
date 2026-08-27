import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { serializeGpx } from '../domain/gpx';
import type { Ride } from '../domain/types';
import { readTrackPointsAsync } from './rideRecordingTask';

const EXPORT_DIR = `${FileSystem.cacheDirectory}gpx-exports/`;

function exportFilename(ride: Ride): string {
  const date = ride.startedAt.toISOString().slice(0, 10);
  return `velolog-ride-${date}-${ride.id.slice(0, 8)}.gpx`;
}

export async function exportRideGpxAsync(ride: Ride, dialogTitle: string): Promise<void> {
  const points = await readTrackPointsAsync(ride.trackUri);
  const xml = serializeGpx({
    name: `VeloLog ride ${ride.startedAt.toISOString()}`,
    description: ride.notes,
    points,
  });

  if (!(await Sharing.isAvailableAsync())) throw new Error('Native sharing is unavailable');

  await FileSystem.deleteAsync(EXPORT_DIR, { idempotent: true });
  await FileSystem.makeDirectoryAsync(EXPORT_DIR, { intermediates: true });
  const uri = `${EXPORT_DIR}${exportFilename(ride)}`;
  await FileSystem.writeAsStringAsync(uri, xml);
  await Sharing.shareAsync(uri, {
    mimeType: 'application/gpx+xml',
    UTI: 'com.topografix.gpx',
    dialogTitle,
  });
}
