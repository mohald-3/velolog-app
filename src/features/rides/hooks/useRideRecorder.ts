import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import * as Location from 'expo-location';

import { applyGpsFilters, computeMovingStats, haversineDistanceM, speedKmh } from '../../../domain/gps-filter';
import type { RawGpsPoint } from '../../../domain/gps-filter';
import { initialRecordingState, recordingReducer } from '../../../domain/recording';
import {
  discardRideRecordingAsync,
  pauseRideRecordingAsync,
  readActiveRideAsync,
  readTrackPointsAsync,
  resumeRideRecordingAsync,
  startRideRecordingAsync,
  stopRideRecordingAsync,
} from '../../../../tasks/rideRecordingTask';

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

export type StartResult = 'granted' | 'foreground-denied' | 'background-denied';

export interface RideSummary {
  bikeId: string;
  startedAt: number;
  endedAt: number;
  distanceM: number;
  movingTimeMs: number;
  pausedTimeMs: number;
  trackUri: string;
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

/** Background-capable ride recording: GPS points are appended to disk by
 * tasks/rideRecordingTask.ts regardless of app/screen lifecycle, so a killed app can rehydrate
 * an in-progress ride on relaunch (mount-time effect below) instead of losing it. This hook's
 * job is display (poll the track file, derive live stats) and lifecycle orchestration — the
 * actual persistence and background survival lives in the task module. */
export function useRideRecorder(bikeId: string) {
  const [state, dispatch] = useReducer(recordingReducer, initialRecordingState);
  const [rawPoints, setRawPoints] = useState<RawGpsPoint[]>([]);
  const trackUriRef = useRef<string | null>(null);

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
      dispatch({ type: 'START', bikeId: active.bikeId, at: active.startedAt });

      if (active.status === 'paused') {
        dispatch({ type: 'PAUSE', at: Date.now() });
      } else {
        await resumeRideRecordingAsync();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bikeId]);

  // Poll the track file for points appended by the background task while recording.
  useEffect(() => {
    if (state.status !== 'recording' || !trackUriRef.current) return;
    const trackUri = trackUriRef.current;

    const poll = async () => {
      setRawPoints(await readTrackPointsAsync(trackUri));
    };
    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [state.status]);

  const filteredPoints = useMemo(() => applyGpsFilters(rawPoints), [rawPoints]);
  const stats = useMemo(() => computeLiveStats(filteredPoints), [filteredPoints]);

  const start = useCallback(async (): Promise<StartResult> => {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') return 'foreground-denied';

    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== 'granted') return 'background-denied';

    setRawPoints([]);
    const active = await startRideRecordingAsync(bikeId);
    trackUriRef.current = active.trackUri;
    dispatch({ type: 'START', bikeId, at: active.startedAt });
    return 'granted';
  }, [bikeId]);

  const pause = useCallback(async () => {
    await pauseRideRecordingAsync();
    dispatch({ type: 'PAUSE', at: Date.now() });
  }, []);

  const resume = useCallback(async () => {
    await resumeRideRecordingAsync();
    dispatch({ type: 'RESUME', at: Date.now() });
  }, []);

  const stop = useCallback(async (): Promise<RideSummary | null> => {
    if (state.status !== 'recording' && state.status !== 'paused') return null;
    const trackUri = trackUriRef.current;
    if (!trackUri) return null;

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
    };
  }, [state]);

  const discard = useCallback(async () => {
    await discardRideRecordingAsync();
    dispatch({ type: 'DISCARD', at: Date.now() });
  }, []);

  return { state, stats, start, pause, resume, stop, discard };
}
