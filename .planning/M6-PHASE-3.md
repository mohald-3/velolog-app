# Phase 3: GPX Export

> Status: Pending

## Objective

Export completed rides as portable GPX 1.1 files without modifying local data.

## Tasks

- [ ] Build/test deterministic GPX 1.1 XML with escaped metadata, coordinates, UTC time, and optional elevation.
  - Files: `src/domain/gpx.ts`, `src/domain/gpx.test.ts`, GPX fixtures
- [ ] Build export service to read points, create a safe cache file, share it, and clean stale exports without touching source tracks.
  - Files: `src/services/gpxExport.ts`
- [ ] Add a hook coordinating loading/export/errors.
  - Files: `src/features/rides/hooks/useRideExport.ts`
- [ ] Add translated Export GPX to the ride overflow menu with progress and double-tap protection.
  - Files: `src/features/rides/screens/RideDetailScreen.tsx`, `src/i18n/en.json`, `src/i18n/sv.json`

## Verification

- [ ] XML fixtures cover namespace, escaping, ordering, time, and optional fields.
- [ ] Missing/empty/corrupt tracks fail clearly without misleading output.
- [ ] Android recognizes the shared filename/type and an independent GPX app opens it.
- [ ] Full automated checks pass.

## Exit Criteria

Every valid completed ride can be exported through Android sharing, entirely offline.
