# Feature Complete: M3 — Ride History & Statistics (v0.1c)

> Completed: 2026-07-11
> Duration: 1 session
> Phases: 3 planned, 3 executed

## What Was Built

The loop M2 left open: seeing a recorded ride again. A ride list grouped by day, a ride detail
screen with the track rendered as a MapLibre polyline plus full stats and editable notes, a
bike-level statistics screen (total distance, total time, longest/average ride, ride count), and
soft-delete with automatic odometer recomputation. Also fixed a real app-wide bug found during
live verification: the app had no `SafeAreaProvider` anywhere, so on edge-to-edge Android
(Expo SDK 54+ default) bottom-of-screen content rendered underneath the system nav bar and was
untappable.

## Changes

- `src/domain/stats.ts` + tests — `groupRidesByDay`, `computeBikeStats`
- `src/features/rides/screens/RideListScreen.tsx` + route — `SectionList` grouped by local day
- `src/features/rides/screens/RideDetailScreen.tsx` + route — MapLibre track polyline (reusing
  the degenerate-bounds/single-point fix proven in the Spike 0 dev screen), stats card, editable
  notes, header actions (share icon, overflow "⋮" dropdown menu with delete)
- `src/features/rides/trackGeo.ts`, `src/features/rides/format.ts` — extracted shared helpers
- `src/features/bikes/screens/BikeStatsScreen.tsx` + route
- `rideRepository.softDelete`, `deletedAt` column + migration, `list()` excludes deleted rides
  by default (mirrors `bikeRepository`'s `includeArchived` pattern)
- `SafeAreaProvider` at root layout + bottom-inset padding across 6 screens
  (`RideDetailScreen`, `RideListScreen`, `BikeDetailScreen`, `AddEditBikeScreen`,
  `AddEditComponentScreen`, `BikeListScreen` incl. its floating FAB)
- Issues: #25, #26, #27, #28
- PR: https://github.com/mohald-3/velolog-app/pull/40

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Added a track-file Share action to ride detail (#26), beyond its original scope | EAS preview/production builds are non-debuggable, so `adb run-as` can't pull a saved ride's NDJSON off a real device — discovered live while trying to compare a two-phone kill-recovery test |
| #28's maintenance rule-status recomputation is a no-op for now | M4 (Maintenance) hasn't started; no `MaintenanceRule` domain exists yet. Odometer recompute still happens automatically since `computeOdometerM` just sums whatever ride list it's given, and `rideRepository.list()` already excludes deleted rides |
| Ride detail's page actions (share, delete) live entirely in the header, not as bottom buttons | Live emulator verification found the app-wide safe-area bug (see below), which made a bottom "Share track file" button literally untappable. Fixed the underlying bug, then moved actions to the header per follow-up user feedback: 1-2 icons directly visible, extra actions behind an overflow "⋮" that opens a real anchored dropdown (not a shortcut straight to the action) |

## Deviations From Plan

- Discovered and fixed an app-wide missing-safe-area bug not in the original plan (see Decisions).
  This blocked live verification of the Share button until fixed.
- Ride detail's Share and Delete actions went through two UI iterations: full-width bottom
  buttons → a header icon for Share + a bottom button for Delete → both fully in the header
  (Share icon + "⋮" overflow dropdown for Delete), per two rounds of live user feedback.
- Otherwise executed as planned across all 3 phases.

## Verification

All live-verified on the Android emulator against real recorded test rides:
- Ride list/detail render correctly; track polyline draws from a saved ride's NDJSON
- Share opens the native Android share sheet with the ride's `.ndjson` file
- Bike stats matched hand-computed expected values exactly (2 rides → 0.3 km total, 3:31 total
  time, 0.23 km longest, 0.17 km average)
- Deleting a ride correctly dropped the bike's odometer (0.3 km → 0.1 km) and ride count (2 → 1),
  confirming the odometer recompute is genuinely automatic and derived
- Overflow menu opens as an anchored dropdown with icon+label rows, not a shortcut to the action

## What's Next

- M4 — Maintenance (v0.2): `MaintenanceRule` CRUD with sensible presets, due-status computation
  after every completed ride, local notifications when a rule crosses into DueSoon/Overdue,
  "mark as done" flow, maintenance log view, component replacement flow. This is where #28's
  currently-no-op rule-status recomputation gets real logic to call.
- Spike 0's two still-open real-device items (#5 deliberate kill test, #6 urban-vs-open-road
  accuracy) remain separate — they need an actual outdoor ride, not an emulator.
