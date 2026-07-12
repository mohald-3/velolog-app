import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

export const LOCATION_TASK_NAME = 'velolog-spike-location-task';
export const TRACK_LOG_URI = `${FileSystem.documentDirectory}spike-track.ndjson`;

type LoggedPoint = {
  ts: number;
  lat: number;
  lon: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
};

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[locationTask]', error.message);
    return;
  }

  const { locations } = (data ?? {}) as { locations?: Location.LocationObject[] };
  if (!locations || locations.length === 0) return;

  const lines = locations
    .map((loc): LoggedPoint => ({
      ts: loc.timestamp,
      lat: loc.coords.latitude,
      lon: loc.coords.longitude,
      accuracy: loc.coords.accuracy,
      altitude: loc.coords.altitude,
      speed: loc.coords.speed,
      heading: loc.coords.heading,
    }))
    .map((point) => JSON.stringify(point))
    .join('\n');

  await appendLines(lines);
});

async function appendLines(lines: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(TRACK_LOG_URI);
  const existing = info.exists ? await FileSystem.readAsStringAsync(TRACK_LOG_URI) : '';
  const next = existing ? `${existing}\n${lines}` : lines;
  await FileSystem.writeAsStringAsync(TRACK_LOG_URI, next);
}

export async function startTrackingAsync(): Promise<void> {
  const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(
    () => false
  );
  if (alreadyRunning) return;

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.High,
    timeInterval: 2000,
    distanceInterval: 5,
    showsBackgroundLocationIndicator: true,
    pausesUpdatesAutomatically: false,
    foregroundService: {
      notificationTitle: 'VeloLog is recording your ride',
      notificationBody: 'Tap to return to the app.',
      notificationColor: '#2f6f4f',
    },
  });
}

export async function stopTrackingAsync(): Promise<void> {
  const running = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(
    () => false
  );
  if (running) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
}

export async function readLogStatsAsync(): Promise<{ pointCount: number; sizeBytes: number }> {
  const info = await FileSystem.getInfoAsync(TRACK_LOG_URI);
  if (!info.exists) return { pointCount: 0, sizeBytes: 0 };

  const content = await FileSystem.readAsStringAsync(TRACK_LOG_URI);
  const pointCount = content ? content.split('\n').filter(Boolean).length : 0;
  return { pointCount, sizeBytes: info.size ?? 0 };
}

export async function clearLogAsync(): Promise<void> {
  const info = await FileSystem.getInfoAsync(TRACK_LOG_URI);
  if (info.exists) {
    await FileSystem.deleteAsync(TRACK_LOG_URI);
  }
}
