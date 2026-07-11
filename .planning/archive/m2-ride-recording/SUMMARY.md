# Feature Complete: M2 — Ride Recording (v0.1b)

> Completed: 2026-07-11
> Duration: 1 session
> Phases: 5 planned, 5 executed

## What Was Built

A full ride-recording loop: start/pause/resume/stop a ride from a bike's detail screen, with
GPS points filtered through a pure domain pipeline for live stats, background continuation via
a dedicated TaskManager task, crash/kill recovery (verified by force-stopping the app
mid-recording and mid-paused, then confirming correct rehydration), and a save flow that
persists the ride and fixes the bike detail screen to display the derived odometer/wear instead
of the bike's raw starting value.

## Changes

- `src/domain/gps-filter.ts` + tests — accuracy filter, implausible-jump filter, haversine
  distance accumulation, moving/paused time classification, `shouldAutoPause` primitive
- `src/domain/recording.ts` + tests — pure recording state-machine reducer
- `src/domain/odometer.ts` + tests — `computeOdometerM`, derived (never stored)
- `rides` table + migration, `rideRepository`
- `src/features/rides/` — `useRideRecorder` (GPS lifecycle + live stats), `useRides`/
  `useCreateRide` (TanStack Query), `RecordRideScreen`
- `tasks/rideRecordingTask.ts` — background-capable location task, per-ride NDJSON persistence,
  `active-ride.json` pointer for crash recovery
- `BikeDetailScreen` — "Start a Ride" entry point; odometer/wear now derived from actual rides
- Follow-up: wired the "Auto-pause" toggle (`shouldAutoPause` + staleness fallback for genuine
  dead-stops, `auto` flag on the persisted `ActiveRide` pointer, auto-resume) — see Deviations
- Issue: #14, #15, #16, #17, #18, #19, #20, #21, #22, #23, #24
- PR: https://github.com/mohald-3/velolog-app/pull/39

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Bike odometer stays derived (`startingOdometerM + sum(ride.distanceM)`), never a stored/mutated counter | Matches the existing comment in `src/domain/types.ts` and CLAUDE.md's "never stored counters that can drift" principle |
| New `tasks/rideRecordingTask.ts` sibling module instead of editing `tasks/locationTask.ts` in place | Keeps the existing GPS-spike dev screen working unmodified; both registered at startup in `index.ts` |
| Rehydration reuses the existing `START`/`PAUSE` domain events (with the original timestamp) rather than adding a new domain event | Keeps the pure reducer simple — "resume after a kill" is just replaying history, not a new concept |
| `stop()` re-reads the track file before computing final stats rather than trusting the last poll | Avoids losing up to one poll-interval's worth of points from the saved totals |

## Deviations From Plan

- Issue **#21** (GPS filter optional auto-pause toggle) was initially left open at the end of
  Phase 1-5 execution — only the pure classifier primitive (`shouldAutoPause`) had been built,
  not the actual toggle. Closed immediately after as a quick same-session follow-up (see below).
- Otherwise executed as planned across all 5 phases.

## Auto-pause follow-up (same day)

Wired `shouldAutoPause` into an actual "Auto-pause" toggle on the recording screen. Turned out
to need two signals, not one: a slow-but-still-moving segment, and a genuine dead stop — which
produces *no new GPS points at all* since `distanceInterval: 5` filters out updates below 5m of
movement, so a real stop looks identical to "GPS momentarily quiet" without a staleness fallback
(no new point for 8s while recording). Auto-pause deliberately leaves location updates running
(unlike manual pause, which stops them to save battery) so movement can be detected again to
auto-resume; `ActiveRide` gained an `auto` flag for this, persisted so a killed-and-relaunched
auto-paused ride still knows to keep tracking.

Found and fixed a real bug during manual testing: the first point after an auto-resume forms a
segment spanning the entire paused gap (tiny distance over minutes), which read as near-zero
speed and immediately re-triggered auto-pause. Segments spanning an implausibly large gap are
now ignored for auto-pause purposes (`MAX_SEGMENT_GAP_MS`).

Verified live on the emulator: auto-pause via a slow segment, auto-pause via staleness (dead
stop — confirmed no track file writes happened at all), auto-resume, manual pause/resume
unaffected, and Stop still saves correctly. Also needed a full emulator restart mid-session
after location delivery silently broke from accumulated test-session state (many force-stops
in one long session) — confirmed via `dumpsys location` that the OS-level mock GPS was updating
correctly but the app wasn't receiving it; a clean emulator boot resolved it. Not an app bug.

## What's Next

- M3 — Ride History & Statistics (v0.1c): ride list, ride detail with the recorded track
  rendered on the MapLibre map (Spike 0 already proved this works), bike statistics screen,
  soft-delete.
- Spike 0's two still-open real-device items (#5 deliberate kill test, #6 urban-vs-open-road
  accuracy) remain separate from this work — they need an actual outdoor ride, not an emulator.
