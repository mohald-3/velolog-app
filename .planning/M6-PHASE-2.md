# Phase 2: Elevation Pipeline

> Status: Pending

## Objective

Capture altitude, derive defensible elevation gain, and expose it safely for new and legacy rides.

## Tasks

- [ ] Map Expo altitude/vertical accuracy into optional raw-point fields.
  - Files: `src/services/rideRecordingTask.ts`, `src/domain/gps-filter.ts`
- [ ] Implement/test accuracy rejection, smoothing, meaningful positive accumulation, and insufficient-data handling.
  - Files: `src/domain/elevation.ts`, `src/domain/elevation.test.ts`
- [ ] Calculate/persist gain in the existing stop/save flow without weakening crash recovery.
  - Files: `src/features/rides/hooks/useRideRecorder.ts`, `src/features/rides/hooks/useRides.ts`
- [ ] Add idempotent legacy recomputation that changes only the derived summary, never track points.
  - Files: `src/data/repositories/rideRepository.ts`, `src/features/rides/hooks/useRides.ts`, `src/features/queryKeys.ts`
- [ ] Add localized ride-detail elevation and unavailable/retry states.
  - Files: `src/features/rides/screens/RideDetailScreen.tsx`, `src/i18n/en.json`, `src/i18n/sv.json`

## Verification

- [ ] Tests cover noise, climbs, descents, gaps, accuracy rejection, and insufficient samples.
- [ ] Recompute is idempotent and old tracks remain untouched.
- [ ] Metres/feet and English/Swedish render correctly.
- [ ] Full automated checks pass.

## Exit Criteria

A recorded ride can show plausible climbing and every old ride still loads safely.
