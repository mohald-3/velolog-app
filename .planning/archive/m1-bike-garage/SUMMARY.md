# Feature Complete: M1 — Bike Garage (v0.1a)

> Completed: 2026-07-10
> Duration: 1 session
> Phases: 4 planned, 4 executed

## What Was Built

The first real product code and the architecture everything else builds on: expo-router +
Drizzle/expo-sqlite scaffold, a repository layer (`BikeRepository`/`ComponentRepository`)
sitting between UI and the database, and full Bike + Component CRUD screens — add/edit/archive
a bike with a photo and a manually-settable starting odometer, attach components with an
installed-at-odometer baseline, and see derived wear-in-km per component.

## Changes

- `src/domain/`: `types.ts` (Bike, Component, New*/*Update variants), `wear.ts` +
  `wear.test.ts` (first real domain logic + unit test)
- `src/data/`: `schema.ts` (bikes + components tables), `db.ts`, `repositories/`
  (bikeRepository, componentRepository), Drizzle migration
- `src/features/bikes/`: hooks (`useBikes.ts`, `useComponents.ts`) and screens
  (`BikeListScreen`, `AddEditBikeScreen`, `BikeDetailScreen`, `AddEditComponentScreen`)
- `src/app/`: root layout (migrations + QueryClientProvider), bikes/components routes,
  relocated Spike 0 GPS screen to `dev/gps-spike.tsx`
- Issues: #8, #9, #10, #11, #12, #13 — all closed
- Milestone M1 closed (6/6 issues)

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Scaffold at repo root, extending Spike 0's app rather than starting fresh | Avoids redoing Expo init; Spike 0's GPS code stayed reachable at `src/app/dev/gps-spike.tsx` |
| Schema scoped to bikes + components only | Rides/maintenance tables aren't needed until M2/M4 — building them now would be speculative |
| `startingOdometerM` stored, "current odometer" always derived | No stored/mutable odometer counter that can drift, consistent with the plan's invariant for component wear and rule due-status |
| `--legacy-peer-deps` + committed `.npmrc` | expo-router optionally pulls in web-only UI deps expecting react-dom, irrelevant for this Android-first native app |
| Single Stack navigator, no tabs yet | Only one feature (bikes) exists; revisit once M2/M3 add Rides screens |
| Component form dates as plain YYYY-MM-DD text input | No date-picker dependency added yet — pragmatic for M1, upgradeable later without architecture changes |

## Deviations From Plan

None structurally — all 4 planned phases executed as scoped. Along the way, fixed three real
tooling issues surfaced by actually verifying (not just writing code): un-hoisted babel
packages, a CI-breaking lockfile drift (fixed with `.npmrc` + clean regen), and a missing
`@types/jest` resolution (needed explicit `"types": ["jest"]` in tsconfig).

## What's Next

M2 — Ride Recording (v0.1b): the recording state machine, GPS filtering pipeline (this is
where `src/domain` gets its next and much larger set of pure functions + unit tests), and
wiring completed rides to increment `startingOdometerM`-based bike odometer.

Also still open from Spike 0 (M0): issues #5 (deliberate kill test), #6 (open-road route
comparison), #7 (render the track on a map) — postponed, needs a real outdoor ride.
