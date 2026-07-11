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
- Issue: #14, #15, #16, #17, #18, #19, #20, #22, #23, #24
- PR: (see `gh pr list`)

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Bike odometer stays derived (`startingOdometerM + sum(ride.distanceM)`), never a stored/mutated counter | Matches the existing comment in `src/domain/types.ts` and CLAUDE.md's "never stored counters that can drift" principle |
| New `tasks/rideRecordingTask.ts` sibling module instead of editing `tasks/locationTask.ts` in place | Keeps the existing GPS-spike dev screen working unmodified; both registered at startup in `index.ts` |
| Rehydration reuses the existing `START`/`PAUSE` domain events (with the original timestamp) rather than adding a new domain event | Keeps the pure reducer simple — "resume after a kill" is just replaying history, not a new concept |
| `stop()` re-reads the track file before computing final stats rather than trusting the last poll | Avoids losing up to one poll-interval's worth of points from the saved totals |

## Deviations From Plan

- Issue **#21** (GPS filter optional auto-pause toggle) is **not closed**. Only the pure
  classifier primitive (`shouldAutoPause`) was built and unit-tested; it was never wired into
  `useRideRecorder`/`RecordRideScreen` as an actual toggle that auto-transitions the recording
  state machine to Paused. Left open — a small follow-up, not a re-plan.
- Otherwise executed as planned across all 5 phases.

## What's Next

- Wire up issue #21 (auto-pause toggle) as a small standalone follow-up.
- M3 — Ride History & Statistics (v0.1c): ride list, ride detail with the recorded track
  rendered on the MapLibre map (Spike 0 already proved this works), bike statistics screen,
  soft-delete.
- Spike 0's two still-open real-device items (#5 deliberate kill test, #6 urban-vs-open-road
  accuracy) remain separate from this work — they need an actual outdoor ride, not an emulator.
