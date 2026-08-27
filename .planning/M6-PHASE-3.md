# Phase 3: GPX Export

> Status: Complete — Android interoperability verification deferred to issue #58

## Objective

Export completed rides as portable GPX 1.1 files without modifying local data.

## Tasks

- [x] Build/test deterministic GPX 1.1 XML with escaped metadata, coordinates, UTC time, and optional elevation.
  - Files: `src/domain/gpx.ts`, `src/domain/gpx.test.ts`, GPX fixtures
- [x] Build export service to read points, create a safe cache file, share it, and clean stale exports without touching source tracks.
  - Files: `src/services/gpxExport.ts`
- [x] Add a hook coordinating loading/export/errors.
  - Files: `src/features/rides/hooks/useRideExport.ts`
- [x] Add translated Export GPX to the ride overflow menu with progress and double-tap protection.
  - Files: `src/features/rides/screens/RideDetailScreen.tsx`, `src/i18n/en.json`, `src/i18n/sv.json`

## Verification

- [x] XML fixtures cover namespace, escaping, ordering, time, and optional fields.
- [x] Missing/empty/corrupt tracks fail clearly without misleading output.
- [x] Android interoperability verification tracked for M6 release readiness in issue #58.
- [x] Full automated checks pass.

## Exit Criteria

Every valid completed ride can be exported through Android sharing, entirely offline.

Manual Android share-sheet and independent-app verification is tracked in
[issue #58](https://github.com/mohald-3/velolog-app/issues/58) for completion before the M6 release.
