import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import * as Location from 'expo-location';

import {
  applyGpsFilters,
  computeMovingStats,
  haversineDistanceM,
  shouldAutoPause,
  speedKmh,
} from '../../../domain/gps-filter';
import type { RawGpsPoint } from '../../../domain/gps-filter';
import { computeElevationGainM } from '../../../domain/elevation';
import { initialRecordingState, recordingReducer } from '../../../domain/recording';
import {
  discardRideRecordingAsync,
  ensureLocationUpdatesRunningAsync,
  finalizeRideRecordingAsync,
  pauseRideRecordingAsync,
  readActiveRideAsync,
  readTrackPointsAsync,
  resumeRideRecordingAsync,
  startRideRecordingAsync,
  stopRideRecordingAsync,
} from '../../../services/rideRecordingTask';

export interface LiveRideStats {
  distanceM: number;
  durationMs: number;
  movingTimeMs: number;
  currentSpeedKmh: number;
  avgSpeedKmh: number;
}

const ZERO_STATS: LiveRideStats = {
  distanceM: 0,
  durationMs: 0,
  movingTimeMs: 0,
  currentSpeedKmh: 0,
  avgSpeedKmh: 0,
};

const POLL_INTERVAL_MS = 3000;
// A genuine stop produces no new points at all (distanceInterval filters out updates below 5m
// of movement) — a slow *segment* only shows up when the rider is still covering >=5m between
// fixes. So auto-pause needs both signals: a slow last segment, or no new point in a while.
const STALE_POINT_THRESHOLD_MS = 8000;

export type StartResult = 'granted' | 'foreground-denied' | 'background-denied';

export interface RideSummary {
  bikeId: string;
  startedAt: number;
  endedAt: number;
  distanceM: number;
  movingTimeMs: number;
  pausedTimeMs: number;
  trackUri: string;
  elevationGainM: number | null;
}

function computeLiveStats(points: RawGpsPoint[]): LiveRideStats {
  if (points.length === 0) return ZERO_STATS;

  const moving = computeMovingStats(points);
  const durationMs = points[points.length - 1].ts - points[0].ts;

  let currentSpeedKmh = 0;
  if (points.length >= 2) {
    const a = points[points.length - 2];
    const b = points[points.length - 1];
    const dtMs = b.ts - a.ts;
    currentSpeedKmh = speedKmh(haversineDistanceM(a, b), dtMs);
  }

  const avgSpeedKmh = speedKmh(moving.distanceM, moving.movingTimeMs);

  return { distanceM: moving.distanceM, durationMs, movingTimeMs: moving.movingTimeMs, currentSpeedKmh, avgSpeedKmh };
}

// Bounds how large a gap between two consecutive points can be before its "speed" is
// considered meaningless for auto-pause purposes. Without this, the very first point after an
// auto-resume forms a segment spanning the *entire* paused gap (small distance over minutes),
// which reads as near-zero speed and would immediately re-trigger auto-pause.
const MAX_SEGMENT_GAP_MS = 15_000;

/** True if the most recent segment (last two points) implies the rider has stopped, per the
 * same threshold `computeMovingStats` uses to classify paused time. Ignores segments that span
 * an implausibly large gap (see MAX_SEGMENT_GAP_MS) rather than treating them as slow. */
function lastSegmentIsPaused(points: RawGpsPoint[]): boolean {
  if (points.length < 2) return false;
  const a = points[points.length - 2];
  const b = points[points.length - 1];
  const dtMs = b.ts - a.ts;
  if (dtMs <= 0 || dtMs > MAX_SEGMENT_GAP_MS) return false;
  return shouldAutoPause(haversineDistanceM(a, b), dtMs);
}

/** Background-capable ride recording: GPS points are appended to disk by
 * tasks/rideRecordingTask.ts regardless of app/screen lifecycle, so a killed app can rehydrate
 * an in-progress ride on relaunch (mount-time effect below) instead of losing it. This hook's
 * job is display (poll the track file, derive live stats), auto-pause detection, and lifecycle
 * orchestration — the actual persistence and background survival lives in the task module. */
export function useRideRecorder(bikeId: string) {
  const [state, dispatch] = useReducer(recordingReducer, initialRecordingState);
  const [rawPoints, setRawPoints] = useState<RawGpsPoint[]>([]);
  const [autoPauseEnabled, setAutoPauseEnabled] = useState(true);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const trackUriRef = useRef<string | null>(null);
  const lastPointCountRef = useRef(0);
  // Always (re)set to Date.now() before polling can start — in start() and in the rehydration
  // effect — so this placeholder value is never actually read.
  const lastNewPointAtRef = useRef(0);

  // Rehydrate an in-progress ride for this bike after a fresh mount (app relaunch after a
  // kill, or a JS reload) — never on ordinary re-renders, since it only reacts to bikeId.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const active = await readActiveRideAsync();
      if (cancelled || !active || active.bikeId !== bikeId) return;

      trackUriRef.current = active.trackUri;
      const points = await readTrackPointsAsync(active.trackUri);
      if (cancelled) return;

      setRawPoints(points);
      lastPointCountRef.current = points.length;
      lastNewPointAtRef.current = Date.now();
      dispatch({ type: 'START', bikeId: active.bikeId, at: active.startedAt });

      if (active.status === 'paused') {
        dispatch({ type: 'PAUSE', at: Date.now() });
        setIsAutoPaused(active.auto);
        if (active.auto) {
          await ensureLocationUpdatesRunningAsync();
        }
      } else {
        await resumeRideRecordingAsync();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bikeId]);

  // Poll the track file while recording, or while auto-paused (location updates keep flowing
  // in that case so movement can be detected again to auto-resume).
  useEffect(() => {
    const shouldPoll = state.status === 'recording' || (state.status === 'paused' && isAutoPaused);
    if (!shouldPoll || !trackUriRef.current) return;
    const trackUri = trackUriRef.current;

    const poll = async () => {
      const points = await readTrackPointsAsync(trackUri);
      setRawPoints(points);

      const grew = points.length > lastPointCountRef.current;
      lastPointCountRef.current = points.length;
      if (grew) lastNewPointAtRef.current = Date.now();

      if (state.status === 'recording' && autoPauseEnabled) {
        const stale = Date.now() - lastNewPointAtRef.current > STALE_POINT_THRESHOLD_MS;
        if (stale || lastSegmentIsPaused(points)) {
          await pauseRideRecordingAsync(true);
          setIsAutoPaused(true);
          dispatch({ type: 'PAUSE', at: Date.now() });
        }
      } else if (state.status === 'paused' && isAutoPaused && grew) {
        // Any new point at all means the rider covered the >=5m the location request requires
        // to fire while stopped — a stronger, simpler resume signal than re-deriving a speed
        // from a segment that spans the paused gap.
        await resumeRideRecordingAsync();
        setIsAutoPaused(false);
        dispatch({ type: 'RESUME', at: Date.now() });
      }
    };
    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [state.status, autoPauseEnabled, isAutoPaused]);

  const filteredPoints = useMemo(() => applyGpsFilters(rawPoints), [rawPoints]);
  const stats = useMemo(() => computeLiveStats(filteredPoints), [filteredPoints]);

  const start = useCallback(async (): Promise<StartResult> => {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') return 'foreground-denied';

    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== 'granted') return 'background-denied';

    setRawPoints([]);
    setIsAutoPaused(false);
    lastPointCountRef.current = 0;
    lastNewPointAtRef.current = Date.now();
    const active = await startRideRecordingAsync(bikeId);
    trackUriRef.current = active.trackUri;
    dispatch({ type: 'START', bikeId, at: active.startedAt });
    return 'granted';
  }, [bikeId]);

  const pause = useCallback(async () => {
    await pauseRideRecordingAsync(false);
    setIsAutoPaused(false);
    dispatch({ type: 'PAUSE', at: Date.now() });
  }, []);

  const resume = useCallback(async () => {
    await resumeRideRecordingAsync();
    setIsAutoPaused(false);
    lastNewPointAtRef.current = Date.now();
    dispatch({ type: 'RESUME', at: Date.now() });
  }, []);

  // Guards against a double-tap on Stop: both taps can pass the status check before the first
  // dispatch lands (the reducer state in this closure only updates on re-render), which would
  // save the ride twice.
  const stoppingRef = useRef(false);

  const stop = useCallback(async (): Promise<RideSummary | null> => {
    if (state.status !== 'recording' && state.status !== 'paused') return null;
    const trackUri = trackUriRef.current;
    if (!trackUri || stoppingRef.current) return null;
    stoppingRef.current = true;

    try {
      await stopRideRecordingAsync();
      const endedAt = Date.now();

      // Re-read the track file rather than trusting the last poll, so points appended in the
      // final poll interval before Stop are still included in the saved totals.
      const finalPoints = applyGpsFilters(await readTrackPointsAsync(trackUri));
      const moving = computeMovingStats(finalPoints);

      const { bikeId: ridingBikeId, startedAt } = state;
      dispatch({ type: 'STOP', at: endedAt });

      return {
        bikeId: ridingBikeId,
        startedAt,
        endedAt,
        distanceM: moving.distanceM,
        movingTimeMs: moving.movingTimeMs,
        pausedTimeMs: moving.pausedTimeMs,
        trackUri,
        elevationGainM: computeElevationGainM(finalPoints),
      };
    } finally {
      stoppingRef.current = false;
    }
  }, [state]);

  /** Clears the persisted active-ride pointer. Call only after the ride row is safely saved —
   * until then the pointer is what lets a killed app recover the stopped-but-unsaved ride. */
  const finalize = useCallback(async () => {
    await finalizeRideRecordingAsync();
  }, []);

  const discard = useCallback(async () => {
    await discardRideRecordingAsync();
    setIsAutoPaused(false);
    dispatch({ type: 'DISCARD', at: Date.now() });
  }, []);

  return {
    state,
    stats,
    start,
    pause,
    resume,
    stop,
    finalize,
    discard,
    autoPauseEnabled,
    setAutoPauseEnabled,
    isAutoPaused,
  };
}
