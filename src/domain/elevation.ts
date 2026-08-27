import type { RawGpsPoint } from './gps-filter';

/** Vertical accuracy above this is too noisy for a trustworthy ride-level ascent summary. */
export const DEFAULT_MAX_VERTICAL_ACCURACY_M = 15;
/** Ignore smaller reversals so ordinary GPS altitude jitter is not counted as climbing. */
export const DEFAULT_MIN_ELEVATION_CHANGE_M = 3;
const SMOOTHING_WINDOW_SIZE = 3;
/** Do not infer climbing across a long period without usable altitude samples. */
export const DEFAULT_MAX_ELEVATION_SAMPLE_GAP_MS = 30_000;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * Computes total ascent from GPS altitude without treating normal vertical jitter as climbing.
 * Invalid/inaccurate samples are removed, a centered three-sample median suppresses isolated
 * spikes, and a 3 m hysteresis threshold retains gradual climbs while ignoring small reversals.
 * Returns null when fewer than three usable samples remain; zero means usable but flat/descent-only.
 */
export function computeElevationGainM(
  points: RawGpsPoint[],
  options?: {
    maxVerticalAccuracyM?: number;
    minElevationChangeM?: number;
    maxSampleGapMs?: number;
  }
): number | null {
  const maxAccuracy = options?.maxVerticalAccuracyM ?? DEFAULT_MAX_VERTICAL_ACCURACY_M;
  const minChange = options?.minElevationChangeM ?? DEFAULT_MIN_ELEVATION_CHANGE_M;
  const maxSampleGapMs = options?.maxSampleGapMs ?? DEFAULT_MAX_ELEVATION_SAMPLE_GAP_MS;
  const runs: number[][] = [];
  let currentRun: number[] = [];
  let lastUsableTimestamp: number | null = null;

  for (const point of points) {
    const altitude = point.altitudeM;
    const accuracy = point.verticalAccuracyM;
    if (altitude == null || !Number.isFinite(altitude)) continue;
    if (accuracy != null && (!Number.isFinite(accuracy) || accuracy > maxAccuracy)) continue;

    if (
      lastUsableTimestamp != null &&
      (point.ts <= lastUsableTimestamp || point.ts - lastUsableTimestamp > maxSampleGapMs)
    ) {
      if (currentRun.length >= SMOOTHING_WINDOW_SIZE) runs.push(currentRun);
      currentRun = [];
    }
    currentRun.push(altitude);
    lastUsableTimestamp = point.ts;
  }
  if (currentRun.length >= SMOOTHING_WINDOW_SIZE) runs.push(currentRun);

  if (runs.length === 0) return null;

  return runs.reduce((totalGainM, altitudes) => totalGainM + computeRunGainM(altitudes, minChange), 0);
}

function computeRunGainM(altitudes: number[], minChange: number): number {
  const smoothed = altitudes.map((altitude, index) => {
    if (index === 0 || index === altitudes.length - 1) return altitude;
    return median(altitudes.slice(index - 1, index + 2));
  });

  let gainM = 0;
  let anchorM = smoothed[0];
  for (let index = 1; index < smoothed.length; index++) {
    const changeM = smoothed[index] - anchorM;
    if (changeM >= minChange) {
      gainM += changeM;
      anchorM = smoothed[index];
    } else if (changeM <= -minChange) {
      anchorM = smoothed[index];
    }
  }

  return gainM;
}
