# Feature: M3 — Ride History & Statistics (v0.1c)

> Created: 2026-07-11
> Status: Phase 1 complete — ready to execute Phase 2
> Milestone: M3 - Ride History & Statistics (v0.1c) — GitHub milestone, issues #25-#28

## Goal

See recorded rides in the app: a list, a detail view with the track on a map and full stats,
bike-level aggregate stats, and safe deletion — closing the loop on M2's recording work.

## Requirements

- [x] Ride list grouped by day (distance, duration, avg speed) (#25)
- [x] Ride detail: map with track polyline, full stats, notes field (#26) — plus a Share action
      for the raw track file, since EAS preview/production builds aren't debuggable and there's
      currently no way to get a saved ride's NDJSON off a real device otherwise (found today
      while comparing a kill-recovery test across two phones)
- [ ] Bike statistics screen: total distance, longest ride, total time, average ride, ride
      count (#27)
- [ ] Soft-delete ride (deletedAt) with odometer recomputation (#28) — the "rule-status
      recomputation" half of this issue is a no-op for now: no MaintenanceRule domain exists
      yet (that's M4, not started). Odometer recompute is automatic since it's already derived
      from non-deleted rides; deleting one just needs to exclude it from that sum.

**Immediate driver**: user recorded two real rides today on two phones (one force-killed twice
mid-ride to stress-test M2's crash recovery, one left running) and wants to compare them —
currently blocked since there's no way to view or export a saved ride at all.

## Roadmap

### Phase 1: Ride list + ride detail (map, stats, share) — medium/large — DONE
- [x] Ride list screen grouped by day, entry point from `BikeDetailScreen`
- [x] Ride detail screen: MapLibre track polyline reusing the proven approach from
      `src/app/dev/track-map.tsx` (including the degenerate-bounds/single-point fix), full
      stats (distance, duration, avg speed, moving vs paused time), editable notes field via
      `rideRepository.update`/`RideUpdate`
- [x] Share action on ride detail: `expo-sharing` on the ride's `trackUri` — implemented as a
      header icon (top-right, next to back button) rather than a full-width button, per
      live feedback once the first version was working on the emulator
- [x] This phase directly unblocks today's kill-test comparison

### Phase 2: Bike statistics screen — small/medium
- [ ] Pure domain function(s) for aggregate stats (total distance, longest ride, total time,
      average ride, ride count) over a bike's rides, with unit tests
- [ ] Screen wired via `useRides`, entry point from `BikeDetailScreen`

### Phase 3: Soft-delete ride — small/medium
- [ ] `deletedAt` column + migration on `rides`
- [ ] `rideRepository` queries exclude soft-deleted rides by default (mirrors
      `bikeRepository`'s `isArchived` pattern)
- [ ] Delete action wired from ride list/detail, with confirm dialog (matches
      `BikeDetailScreen`'s archive-bike confirm pattern)
- [ ] Odometer/wear recompute automatically once the deleted ride is excluded from
      `computeOdometerM`'s sum — no new domain code needed, just the repository filter

## Current Position

```
Phase: 2 of 3
Task:  0
Status: Ready to execute Phase 2
```

## Progress

[███████░░░░░░░░░░░░░] 1/3 phases

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-11 | Added a track-file Share action to ride detail (#26) beyond its original scope | Discovered live: EAS preview/production builds are non-debuggable, so `adb run-as` can't pull a saved ride's NDJSON off a real device — the app itself needs to offer this |
| 2026-07-11 | #28's maintenance rule-status recomputation is a no-op for now | M4 (Maintenance) hasn't started; no MaintenanceRule domain exists to recompute. Odometer recompute still happens automatically via the existing derived-sum approach |
| 2026-07-11 | Share action implemented as a header icon instead of a bottom button | Live emulator verification found the app has no safe-area handling anywhere: on edge-to-edge Android (default since Expo SDK 54+), the bottom button's actual touch bounds rendered underneath the system nav bar and were untappable. Fixed app-wide (`SafeAreaProvider` + bottom-inset padding on 6 screens), then moved Share to the header per follow-up feedback |

## Session Log

| Date | Session | What happened |
|------|---------|---------------|
| 2026-07-11 | Planning | Created plan with 3 phases, driven by a real two-phone field test needing comparison |
| 2026-07-11 | Phase 1 | Built ride list, ride detail (map/stats/notes/share), fixed an app-wide missing-safe-area bug found during live verification; typecheck/lint clean; committed on `feat/m3-ride-history` |
