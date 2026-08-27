import { computeElevationGainM } from './elevation';
import { haversineDistanceM, type RawGpsPoint } from './gps-filter';
import type { GpxImportPoint, ParsedGpx } from './gpx';

export interface GpxImportSummary {
  points: RawGpsPoint[];
  distanceM: number;
  startedAt: Date;
  endedAt: Date;
  movingTimeMs: number;
  pausedTimeMs: number;
  elevationGainM: number | null;
}

export interface GpxTimeFallback {
  startedAt: Date;
  durationMs: number;
}

function hasCompleteValidTime(segments: GpxImportPoint[][]): boolean {
  let previous: number | null = null;
  for (const point of segments.flat()) {
    if (point.timestampMs == null || (previous != null && point.timestampMs < previous)) return false;
    previous = point.timestampMs;
  }
  return true;
}

/** Derives an import preview without ever measuring across separate GPX segments. */
export function summarizeGpxImport(gpx: ParsedGpx, fallback?: GpxTimeFallback): GpxImportSummary {
  const distanceM = gpx.segments.reduce(
    (total, segment) =>
      total + segment.slice(1).reduce((sum, point, index) => sum + haversineDistanceM(segment[index], point), 0),
    0
  );
  const flat = gpx.segments.flat();
  const completeTime = hasCompleteValidTime(gpx.segments);
  if (!completeTime && (!fallback || !Number.isFinite(fallback.durationMs) || fallback.durationMs <= 0)) {
    throw new Error('GPX timestamps are missing or invalid; a positive fallback duration is required');
  }
  const startedMs = completeTime ? (flat[0].timestampMs as number) : fallback!.startedAt.getTime();
  const endedMs = completeTime ? (flat.at(-1)!.timestampMs as number) : startedMs + fallback!.durationMs;
  if (!Number.isFinite(startedMs) || !Number.isFinite(endedMs) || endedMs <= startedMs) {
    throw new Error('GPX ride time range is invalid');
  }

  const durationMs = endedMs - startedMs;
  const denominator = Math.max(1, flat.length - 1);
  let pointOffset = 0;
  const pointSegments = gpx.segments.map((segment) => {
    const normalized = segment.map((point, index): RawGpsPoint => ({
      ts: completeTime
        ? (point.timestampMs as number)
        : startedMs + (durationMs * (pointOffset + index)) / denominator,
      lat: point.lat,
      lon: point.lon,
      accuracyM: null,
      altitudeM: point.altitudeM,
    }));
    pointOffset += segment.length;
    return normalized;
  });
  const elevationGainM = pointSegments
    .map((segment) => computeElevationGainM(segment))
    .reduce<number | null>((total, gain) => (gain == null ? total : (total ?? 0) + gain), null);

  return {
    points: pointSegments.flat(),
    distanceM,
    startedAt: new Date(startedMs),
    endedAt: new Date(endedMs),
    movingTimeMs: durationMs,
    pausedTimeMs: 0,
    elevationGainM,
  };
}
