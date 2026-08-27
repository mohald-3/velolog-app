# Phase 2: Elevation Pipeline

> Status: Complete
> Started: 2026-08-27
> Completed: 2026-08-27

## Objective

Capture altitude, derive defensible elevation gain, and expose it safely for new and legacy rides.

## Tasks

- [x] Map Expo altitude/vertical accuracy into optional raw-point fields.
  - Files: `src/services/rideRecordingTask.ts`, `src/domain/gps-filter.ts`
- [x] Implement/test accuracy rejection, smoothing, meaningful positive accumulation, and insufficient-data handling.
  - Files: `src/domain/elevation.ts`, `src/domain/elevation.test.ts`
- [x] Calculate/persist gain in the existing stop/save flow without weakening crash recovery.
  - Files: `src/features/rides/hooks/useRideRecorder.ts`, `src/features/rides/hooks/useRides.ts`
- [x] Add idempotent legacy recomputation that changes only the derived summary, never track points.
  - Files: `src/data/repositories/rideRepository.ts`, `src/features/rides/hooks/useRides.ts`, `src/features/queryKeys.ts`
- [x] Add localized ride-detail elevation and unavailable/retry states.
  - Files: `src/features/rides/screens/RideDetailScreen.tsx`, `src/i18n/en.json`, `src/i18n/sv.json`

## Verification

- [x] Tests cover noise, climbs, descents, gaps, accuracy rejection, and insufficient samples.
- [x] Recompute is idempotent and old tracks remain untouched.
- [x] Metres/feet and English/Swedish render correctly.
- [x] Full automated checks pass.

## Exit Criteria

A recorded ride can show plausible climbing and every old ride still loads safely.
