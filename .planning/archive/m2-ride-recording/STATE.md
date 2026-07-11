# Feature: M2 — Ride Recording (v0.1b)

> Created: 2026-07-11
> Status: All 5 phases complete — ready for /verify and /pr
> Milestone: M2 - Ride Recording (v0.1b) — GitHub milestone #3, issues #14-#24

## Goal

Record a real bike ride start-to-finish (foreground + background GPS), with clean filtered
stats, saved so the bike's odometer and component wear update correctly.

## Requirements

- [ ] GPS filtering pipeline as pure domain functions — accuracy filter, implausible-jump
      filter, haversine distance accumulation, moving-time/pause detection, optional
      auto-pause (#17-#21)
- [ ] Ride domain types + recording state machine (pure reducer: Idle -> Recording -> Paused
      -> Recording -> Completed/Discarded) + `rides` table/migration + `rideRepository` (#14)
- [ ] Foreground recording screen with live stats: distance, duration, current/avg speed (#15)
- [ ] Background continuation extending `tasks/locationTask.ts`'s proven Spike 0 approach (#16)
- [ ] Crash/kill recovery: incremental persistence so a killed app can resume/salvage a ride (#22)
- [ ] Save ride flow: persist ride, recompute bike odometer (derived as
      `startingOdometerM + sum(ride.distanceM)`, never a separately mutated counter — matches
      the existing comment in `src/domain/types.ts`) and component wear (#23)
- [ ] Discard ride flow (#24)

**Exit criteria** (from `docs/PROJECT_PLAN.md`): three real outdoor rides recorded with
believable stats (sane max speed, distance within ~2% of a reference app), odometer correct
afterwards.

## Roadmap

### Phase 1: GPS filtering pipeline (domain) — medium — DONE
- [x] Accuracy filter: drop points with accuracy worse than ~25m (`filterByAccuracy`)
- [x] Jump filter: drop implausible jumps (speed cap ~90 km/h between points) (`filterImplausibleJumps`)
- [x] Haversine distance accumulation over filtered points (`haversineDistanceM`, `accumulateDistanceM`)
- [x] Moving-time detection (speed < ~2 km/h = paused) (`computeMovingStats`)
- [x] Optional auto-pause toggle primitive (`shouldAutoPause`)
- [x] Hard unit tests with synthetic noisy tracks (jitter, gaps, teleports, stationary drift) — 19 tests, `src/domain/gps-filter.test.ts`

### Phase 2: Ride domain model + data layer — medium — DONE
- [x] `Ride`/`NewRide`/`RideUpdate` domain types in `src/domain/types.ts` — ride only persists
      on completion (append-only after: only `bikeId`/`notes` are mutable), `trackUri` points
      at the recorded NDJSON log
- [x] Recording state machine as a pure reducer (Idle/Recording/Paused/Completed/Discarded)
      with unit tests — `src/domain/recording.ts` + `recording.test.ts` (11 tests, incl.
      invalid-transition no-ops)
- [x] `rides` table + Drizzle migration — `drizzle/0001_mighty_night_nurse.sql`
- [x] `rideRepository` (create, getById, list, update) following `bikeRepository` pattern —
      `src/data/repositories/rideRepository.ts`
- [x] `computeOdometerM(bike, rides)` domain function — derived, not stored —
      `src/domain/odometer.ts` + `odometer.test.ts` (4 tests)

### Phase 3: Foreground recording screen — medium — DONE
- [x] Start/pause/resume/stop UI wired to the state machine — `useRideRecorder` hook
      (`src/features/rides/hooks/useRideRecorder.ts`) wraps `recordingReducer` +
      `Location.watchPositionAsync` (foreground only; no background/persistence yet, that's
      Phase 4/5)
- [x] Live stats (distance, duration, current/avg speed) fed by the domain pipeline as
      points arrive — raw points run through `applyGpsFilters` + `computeMovingStats` on
      every update
- [x] Entry point from bike detail screen — "Start a Ride" button on `BikeDetailScreen`
      pushes `/bikes/[id]/record` (`RecordRideScreen`)
- [x] Verified end-to-end on the Android emulator: Start (permission flow), live stats
      updating from fed GPS points, Pause (stats freeze, subscription torn down), Resume,
      Stop (final summary alert, navigates back), Discard (confirm dialog). No crashes/ANRs
      in logcat.

### Phase 4: Background continuation + crash/kill recovery — medium — DONE
- [x] New `tasks/rideRecordingTask.ts` sibling module (reuses Spike 0's proven settings —
      `Accuracy.High`, 2000ms/5m, foreground service) — kept separate from
      `tasks/locationTask.ts` rather than editing it in place, so the existing GPS-spike dev
      screen keeps working unmodified. Registered at startup in `index.ts` alongside the
      spike task, required for headless (killed-app) relaunches to redefine the task.
- [x] Incremental persistence: per-ride NDJSON file under `rides/<uuid>.ndjson`, plus a small
      `active-ride.json` pointer (bikeId, trackUri, startedAt, status) that both the
      TaskManager callback and the hook read/write — the callback doesn't rely on any
      in-memory JS state, so it keeps appending correctly even in a fresh JS context after
      a kill.
- [x] Resume an in-progress ride on relaunch — `useRideRecorder` checks
      `readActiveRideAsync()` on mount; if it matches the current bike, replays `START` (and
      `PAUSE` if the persisted status was `'paused'`) into the existing pure reducer to
      rehydrate `RecordingState`, reads accumulated points from the track file, and re-arms
      location updates via `resumeRideRecordingAsync()`.
- [x] Verified end-to-end on the Android emulator: started a ride, confirmed the pointer +
      track files on device via `run-as`, fed GPS points and confirmed they were appended by
      the background task, **force-stopped the app mid-recording**, relaunched, and confirmed
      the record screen rehydrated directly into Recording state with correct accumulated
      stats and continued appending new points. Repeated for the Paused state (rehydrates to
      Paused, not Recording). Verified Discard deletes both the pointer and track file. No
      crashes/ANRs in logcat throughout.

### Phase 5: Save & discard flow — small/medium — DONE
- [x] Save ride: finalize stats via domain pipeline, persist `Ride` row — `useRideRecorder`'s
      `stop()` now re-reads the track file for freshness, runs it through `computeMovingStats`,
      and returns a `RideSummary`; `RecordRideScreen` persists it via the new
      `useCreateRide()` mutation (`src/features/rides/hooks/useRides.ts`)
- [x] Recompute bike odometer + component wear on save — odometer was never a stored field
      (see Phase 2 decision), so "recompute" meant fixing `BikeDetailScreen` to actually use
      `computeOdometerM(bike, rides)` instead of the raw `bike.startingOdometerM` it was
      reading before (a latent bug that only mattered once rides could exist); component wear
      automatically follows since it's derived from the same value
- [x] Discard ride flow: clean up in-progress state/files, return to Idle — already built and
      verified in Phases 3-4, no changes needed
- [x] Exported `speedKmh` from `src/domain/gps-filter.ts` (was a private helper) and added 2
      unit tests, so both the live-stats hook and the final-summary alert share one formula
      instead of duplicating it
- [x] Verified end-to-end on the Android emulator: recorded a real ride with fed GPS points,
      stopped it, confirmed via `sqlite3` against the pulled on-device DB that the `rides` row
      was created with correct `distance_m`/`moving_time_ms`/`track_uri`, and confirmed
      `BikeDetailScreen`'s Odometer row updated immediately (0.0 km -> 0.2 km) via React Query
      cache invalidation with no manual refresh. No crashes/ANRs.

## Current Position

```
Phase: 5 of 5
Task:  3 of 3
Status: All phases complete
```

## Progress

[████████████████████] 5/5 phases

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-11 | Bike odometer stays derived (`startingOdometerM + sum(ride.distanceM)`), not a stored/mutated counter | Matches existing comment in `src/domain/types.ts` and CLAUDE.md's "never stored counters that can drift" principle; CLAUDE.md's invariant wording ("increments the bike's odometer") describes the observable effect, not the implementation |
| 2026-07-11 | 5 phases instead of fewer/larger ones | GPS filtering pipeline, data layer, foreground UI, background/crash-recovery, and save/discard are each independently completable and testable; keeps each session-sized |
| 2026-07-11 | Closed issue #7 (pick maps library) before starting M2 | Spike 0 track-map dev screen (commit 97d0dc2) proved MapLibre renders a recorded track correctly, including after fixing a degenerate-geometry native-renderer hang |

## Session Log

| Date | Session | What happened |
|------|---------|---------------|
| 2026-07-11 | Planning | Created plan with 5 phases; closed issue #7 (maps library picked: MapLibre) |
| 2026-07-11 | Execute Phase 1 | Added `src/domain/gps-filter.ts` (haversine, accuracy filter, jump filter, `applyGpsFilters` composition, distance accumulation, `computeMovingStats`, `shouldAutoPause`) + 19 unit tests in `src/domain/gps-filter.test.ts`. Typecheck, lint, full test suite (23 tests) all green. |
| 2026-07-11 | Execute Phase 2 | Added `Ride`/`NewRide`/`RideUpdate` types, `src/domain/recording.ts` (pure state-machine reducer, 11 tests), `src/domain/odometer.ts` (`computeOdometerM`, 4 tests), `rides` table + migration (`drizzle/0001_mighty_night_nurse.sql`), `rideRepository`. Typecheck, lint, full test suite (39 tests) all green. |
| 2026-07-11 | Execute Phase 3 | Added `useRideRecorder` hook + `RecordRideScreen` (foreground-only GPS recording, live stats), wired `/bikes/[id]/record` route and a "Start a Ride" entry point on `BikeDetailScreen`. Manually verified the full start/pause/resume/stop/discard flow on the Android emulator with fed GPS points — no crashes. |
| 2026-07-11 | Execute Phase 4 | Added `tasks/rideRecordingTask.ts` (per-ride NDJSON persistence + `active-ride.json` pointer, background-capable via TaskManager) and upgraded `useRideRecorder` to rehydrate an in-progress ride on mount instead of accumulating points in memory only. Verified crash/kill recovery for real: force-stopped the app mid-recording and mid-paused, relaunched both times, confirmed correct rehydration and continued tracking; verified Discard cleans up both files. No crashes/ANRs. |
| 2026-07-11 | Execute Phase 5 | Wired Save: `stop()` returns a final `RideSummary`, persisted via new `useCreateRide()`/`useRides()` hooks. Fixed `BikeDetailScreen` to use `computeOdometerM(bike, rides)` instead of raw `startingOdometerM`. Verified the full record-to-save loop on-device, confirmed the DB row via `sqlite3` against the pulled SQLite file, and confirmed the displayed odometer updates immediately. M2 all 5 phases complete. |
