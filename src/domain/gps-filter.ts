/**
 * Pure GPS filtering pipeline: raw device fixes in, a cleaned track and ride stats out.
 * No React/Expo/DB imports — see CLAUDE.md architecture rules.
 */

export interface RawGpsPoint {
  /** epoch ms */
  ts: number;
  lat: number;
  lon: number;
  /** device-reported horizontal accuracy in meters; null when unknown */
  accuracyM: number | null;
}

export const EARTH_RADIUS_M = 6_371_000;

export function haversineDistanceM(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function speedKmh(distanceM: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  return distanceM / 1000 / (durationMs / 3_600_000);
}

export const DEFAULT_MAX_ACCURACY_M = 25;

/** Drops points whose reported accuracy is worse (a larger radius) than the threshold. Points
 * with unknown (null) accuracy are kept — treating "no data" as "definitely bad" would be too
 * aggressive against devices/providers that don't report it. */
export function filterByAccuracy(
  points: RawGpsPoint[],
  maxAccuracyM = DEFAULT_MAX_ACCURACY_M
): RawGpsPoint[] {
  return points.filter((p) => p.accuracyM === null || p.accuracyM <= maxAccuracyM);
}

export const DEFAULT_MAX_SPEED_KMH = 90;

/** Drops points that imply an impossible speed from the last *kept* point (not the last raw
 * point) — a single bad fix shouldn't poison every point after it. Points at or before the
 * previous kept point's timestamp (out-of-order or duplicate) are dropped outright. */
export function filterImplausibleJumps(
  points: RawGpsPoint[],
  maxSpeedKmh = DEFAULT_MAX_SPEED_KMH
): RawGpsPoint[] {
  if (points.length === 0) return [];

  const kept: RawGpsPoint[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = kept[kept.length - 1];
    const curr = points[i];
    const dtMs = curr.ts - prev.ts;
    if (dtMs <= 0) continue;

    const distM = haversineDistanceM(prev, curr);
    if (speedKmh(distM, dtMs) > maxSpeedKmh) continue;

    kept.push(curr);
  }
  return kept;
}

/** Composes the accuracy and jump filters in the order they should run: accuracy first (cheap,
 * removes obviously-bad fixes), then jump detection (needs a track of already-plausible points). */
export function applyGpsFilters(
  points: RawGpsPoint[],
  options?: { maxAccuracyM?: number; maxSpeedKmh?: number }
): RawGpsPoint[] {
  const accurate = filterByAccuracy(points, options?.maxAccuracyM);
  return filterImplausibleJumps(accurate, options?.maxSpeedKmh);
}

/** Sums haversine distance over consecutive points. Assumes points are already filtered — this
 * does not re-check accuracy or plausibility. */
export function accumulateDistanceM(points: RawGpsPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistanceM(points[i - 1], points[i]);
  }
  return total;
}

export const DEFAULT_PAUSE_SPEED_KMH = 2;

export interface MovingStats {
  distanceM: number;
  movingTimeMs: number;
  pausedTimeMs: number;
  totalTimeMs: number;
}

/** Classifies each consecutive segment as moving or paused by its implied speed, so a ride's
 * duration can be split into "moving time" (used for avg moving speed) vs "paused time" (stopped
 * at lights, taking photos, etc.) without a separate stored flag. */
export function computeMovingStats(
  points: RawGpsPoint[],
  pauseSpeedThresholdKmh = DEFAULT_PAUSE_SPEED_KMH
): MovingStats {
  let distanceM = 0;
  let movingTimeMs = 0;
  let pausedTimeMs = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const dtMs = curr.ts - prev.ts;
    if (dtMs <= 0) continue;

    const segDistM = haversineDistanceM(prev, curr);
    distanceM += segDistM;

    if (speedKmh(segDistM, dtMs) < pauseSpeedThresholdKmh) {
      pausedTimeMs += dtMs;
    } else {
      movingTimeMs += dtMs;
    }
  }

  const totalTimeMs = points.length > 0 ? points[points.length - 1].ts - points[0].ts : 0;
  return { distanceM, movingTimeMs, pausedTimeMs, totalTimeMs };
}

/** Pure classifier for the optional auto-pause feature: given the distance/duration of the most
 * recent segment (e.g. since the last accepted point), should the recording state machine
 * consider the rider stopped? Kept separate from `computeMovingStats` (a batch summary) since
 * auto-pause needs to be evaluated incrementally as points arrive. */
export function shouldAutoPause(
  segmentDistanceM: number,
  segmentDurationMs: number,
  pauseSpeedThresholdKmh = DEFAULT_PAUSE_SPEED_KMH
): boolean {
  if (segmentDurationMs <= 0) return false;
  return speedKmh(segmentDistanceM, segmentDurationMs) < pauseSpeedThresholdKmh;
}
