# Phase 4: GPX Import

> Status: Complete — Android flow verification deferred to issue #60

## Objective

Import third-party GPX through a safe review/save flow that produces a normal VeloLog ride.

## Tasks

- [x] Parse/test GPX 1.0/1.1 tracks/routes, namespaces, segments, optional time/elevation, validation errors, and no cross-segment phantom distance.
  - Files: `src/domain/gpx.ts`, `src/domain/gpx.test.ts`, GPX fixtures
- [x] Derive distance/time/elevation; for missing time, accept date/duration and assign deterministic timestamps.
  - Files: `src/domain/gpx-import.ts`, `src/domain/gpx-import.test.ts`
- [x] Add document/file service with byte/point limits, validate-before-copy, canonical NDJSON output, and orphan cleanup.
  - Files: `src/services/gpxImport.ts`, `package.json`, `app.json` if needed
- [x] Add import draft/save hook reusing exact ride invalidation and maintenance effects.
  - Files: `src/features/rides/hooks/useRideImport.ts`, `src/features/rides/hooks/useRides.ts`, `src/features/queryKeys.ts`
- [x] Build translated review screen/route with picker, map, summary, bike choice, date/duration fallback, validation, cancel, and save guard.
  - Files: `src/features/rides/screens/ImportRideScreen.tsx`, `src/app/rides/import.tsx`, `src/i18n/en.json`, `src/i18n/sv.json`
- [x] Add Import GPX to ride-history header actions, including its empty state.
  - Files: `src/features/rides/screens/RideListScreen.tsx`

## Verification

- [x] Fixtures cover variants, malformed/empty/oversized files, missing time, and invalid coordinates.
- [x] Cancel/failure leaves no ride row or permanent orphan file.
- [ ] One save updates history, odometer, stats, charts, and maintenance exactly once.
- [ ] Imported review and saved ride map/stats match.
- [x] Full automated checks pass.

## Exit Criteria

A representative external GPX saves offline and behaves exactly like a recorded completed ride.

Android picker and end-to-end persistence verification is tracked in
[issue #60](https://github.com/mohald-3/velolog-app/issues/60) for completion before the M6 release.
