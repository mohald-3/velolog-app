import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import type { RawGpsPoint } from '../src/domain/gps-filter';

export const RIDE_RECORDING_TASK_NAME = 'velolog-ride-recording-task';

const RIDES_DIR = `${FileSystem.documentDirectory}rides/`;
const ACTIVE_RIDE_URI = `${FileSystem.documentDirectory}active-ride.json`;

/** Persisted pointer to the ride currently being recorded — read by the task callback (which
 * may run in a fresh JS context after the app was killed) so it knows which file to append to,
 * and by the recording hook on mount so it can resume/rehydrate after a kill. */
export interface ActiveRide {
  bikeId: string;
  trackUri: string;
  startedAt: number;
  status: 'recording' | 'paused';
  /** True when the current 'paused' status was triggered automatically (rider stopped moving)
   * rather than by the user tapping Pause. Meaningless while status is 'recording'. Auto-pause
   * deliberately leaves location updates running (unlike a manual pause) so movement can be
   * detected again to auto-resume; this flag lets a killed-and-relaunched app know it should
   * keep tracking rather than treat the pause as a deliberate battery-saving stop. */
  auto: boolean;
}

TaskManager.defineTask(RIDE_RECORDING_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[rideRecordingTask]', error.message);
    return;
  }

  const { locations } = (data ?? {}) as { locations?: Location.LocationObject[] };
  if (!locations || locations.length === 0) return;

  const activeRide = await readActiveRideAsync();
  if (!activeRide) return;

  const lines = locations
    .map((loc): RawGpsPoint => ({
      ts: loc.timestamp,
      lat: loc.coords.latitude,
      lon: loc.coords.longitude,
      accuracyM: loc.coords.accuracy,
    }))
    .map((point) => JSON.stringify(point))
    .join('\n');

  await appendLines(activeRide.trackUri, lines);
});

async function appendLines(trackUri: string, lines: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(trackUri);
  const existing = info.exists ? await FileSystem.readAsStringAsync(trackUri) : '';
  const next = existing ? `${existing}\n${lines}` : lines;
  await FileSystem.writeAsStringAsync(trackUri, next);
}

async function ensureRidesDirAsync(): Promise<void> {
  const info = await FileSystem.getInfoAsync(RIDES_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(RIDES_DIR, { intermediates: true });
  }
}

async function writeActiveRideAsync(ride: ActiveRide): Promise<void> {
  await FileSystem.writeAsStringAsync(ACTIVE_RIDE_URI, JSON.stringify(ride));
}

async function clearActiveRideAsync(): Promise<void> {
  const info = await FileSystem.getInfoAsync(ACTIVE_RIDE_URI);
  if (info.exists) {
    await FileSystem.deleteAsync(ACTIVE_RIDE_URI);
  }
}

export async function readActiveRideAsync(): Promise<ActiveRide | null> {
  const info = await FileSystem.getInfoAsync(ACTIVE_RIDE_URI);
  if (!info.exists) return null;
  const content = await FileSystem.readAsStringAsync(ACTIVE_RIDE_URI);
  return JSON.parse(content) as ActiveRide;
}

async function startLocationUpdatesIfNeededAsync(): Promise<void> {
  const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(RIDE_RECORDING_TASK_NAME).catch(
    () => false
  );
  if (alreadyRunning) return;

  await Location.startLocationUpdatesAsync(RIDE_RECORDING_TASK_NAME, {
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

/** Starts a brand-new ride recording: fresh track file, fresh active-ride pointer. */
export async function startRideRecordingAsync(bikeId: string): Promise<ActiveRide> {
  await ensureRidesDirAsync();
  const activeRide: ActiveRide = {
    bikeId,
    trackUri: `${RIDES_DIR}${Crypto.randomUUID()}.ndjson`,
    startedAt: Date.now(),
    status: 'recording',
    auto: false,
  };
  await writeActiveRideAsync(activeRide);
  await startLocationUpdatesIfNeededAsync();
  return activeRide;
}

/** Pauses the ride. A manual pause (auto=false, the default) stops location updates to save
 * battery — the rider deliberately stopped for a break. An auto-pause (auto=true) leaves
 * location updates running so movement can be detected again to auto-resume. */
export async function pauseRideRecordingAsync(auto = false): Promise<void> {
  if (!auto) {
    const running = await Location.hasStartedLocationUpdatesAsync(RIDE_RECORDING_TASK_NAME).catch(
      () => false
    );
    if (running) {
      await Location.stopLocationUpdatesAsync(RIDE_RECORDING_TASK_NAME);
    }
  }
  const active = await readActiveRideAsync();
  if (active) {
    await writeActiveRideAsync({ ...active, status: 'paused', auto });
  }
}

/** Re-arms location updates for the currently-persisted active ride and marks it recording
 * again — used for the explicit "Resume" action, auto-resume, and rehydrating a ride that was
 * recording (not paused) when the app was killed. */
export async function resumeRideRecordingAsync(): Promise<void> {
  const active = await readActiveRideAsync();
  if (active) {
    await writeActiveRideAsync({ ...active, status: 'recording', auto: false });
  }
  await startLocationUpdatesIfNeededAsync();
}

/** Re-arms location updates without touching the persisted status/auto fields — used only to
 * rehydrate an auto-paused ride after a kill, in case the OS also killed the foreground
 * service. The UI stays "paused"; this just guarantees points keep arriving so auto-resume can
 * still fire once movement resumes. */
export async function ensureLocationUpdatesRunningAsync(): Promise<void> {
  await startLocationUpdatesIfNeededAsync();
}

export async function stopRideRecordingAsync(): Promise<void> {
  const running = await Location.hasStartedLocationUpdatesAsync(RIDE_RECORDING_TASK_NAME).catch(
    () => false
  );
  if (running) {
    await Location.stopLocationUpdatesAsync(RIDE_RECORDING_TASK_NAME);
  }
  await clearActiveRideAsync();
}

export async function discardRideRecordingAsync(): Promise<void> {
  const activeRide = await readActiveRideAsync();

  const running = await Location.hasStartedLocationUpdatesAsync(RIDE_RECORDING_TASK_NAME).catch(
    () => false
  );
  if (running) {
    await Location.stopLocationUpdatesAsync(RIDE_RECORDING_TASK_NAME);
  }
  await clearActiveRideAsync();

  if (activeRide) {
    const info = await FileSystem.getInfoAsync(activeRide.trackUri);
    if (info.exists) {
      await FileSystem.deleteAsync(activeRide.trackUri);
    }
  }
}

export async function readTrackPointsAsync(trackUri: string): Promise<RawGpsPoint[]> {
  const info = await FileSystem.getInfoAsync(trackUri);
  if (!info.exists) return [];

  const content = await FileSystem.readAsStringAsync(trackUri);
  return content
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as RawGpsPoint);
}
