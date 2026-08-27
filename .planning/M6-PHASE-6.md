# Phase 6: Integration and Release Readiness

> Status: Automated audit complete — awaiting issues #58, #60, and #61

## Objective

Validate M6 end to end, protect existing invariants, and leave v0.3 release-ready.

## Tasks

- [ ] Record/import/export/reassign/delete scenarios; verify odometers, wear, maintenance, Journey, and charts.
- [ ] Import files from at least two external producers; export/open externally; round-trip in a disposable test database.
- [ ] Compare one flat and one climbing ride with a trusted reference and document tolerance/device limitations.
- [ ] Check English/Swedish, metric/imperial, light/dark, large text, screen reader, empty/error/loading, picker/share, and safe areas.
- [ ] Exercise maximum GPX size, chart responsiveness, cache cleanup, and cancellation/failure cleanup.
- [ ] Run all checks, review final diff, update roadmap/current work, and archive `.planning/archive/m6-ride-insights-portability/SUMMARY.md`.
  - Automated checks/diff audit passed 2026-08-28; archival waits for the device-verification tickets.

## Verification

- [x] `npm run typecheck`, `npm run lint`, and `npm test -- --watchAll=false` pass.
- [x] No secrets, machine-local files, missing migrations/translations, layer leaks, or unrelated changes.
- [x] Android dev-client verification is documented truthfully; no unperformed iOS/device check is claimed.

## Automated audit — 2026-08-28

- Typecheck passed; lint passed with the existing `i18next.use` warning only.
- 149 tests pass, including GPX export/import round-trip and local-calendar trend boundaries.
- English/Swedish resources have identical 235-key sets.
- Domain dependency and screen data-boundary scans are clean; no secret patterns were found.
- Migration `0009` covers nullable elevation/source schema additions; later phases require no schema changes.
- The working tree was clean at audit start and the M6 diff contains no machine-local files.

Remaining release gates are intentionally tracked outside this branch:

- #58 — Android GPX export/share interoperability
- #60 — Android GPX picker/review/save and persistence effects
- #61 — distance-insights visual, locale/theme/unit, and TalkBack matrix

## Exit Criteria

The M6 definition of done is satisfied and the milestone can be archived as v0.3 complete.
