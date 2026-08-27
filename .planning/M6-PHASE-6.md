# Phase 6: Integration and Release Readiness

> Status: Pending

## Objective

Validate M6 end to end, protect existing invariants, and leave v0.3 release-ready.

## Tasks

- [ ] Record/import/export/reassign/delete scenarios; verify odometers, wear, maintenance, Journey, and charts.
- [ ] Import files from at least two external producers; export/open externally; round-trip in a disposable test database.
- [ ] Compare one flat and one climbing ride with a trusted reference and document tolerance/device limitations.
- [ ] Check English/Swedish, metric/imperial, light/dark, large text, screen reader, empty/error/loading, picker/share, and safe areas.
- [ ] Exercise maximum GPX size, chart responsiveness, cache cleanup, and cancellation/failure cleanup.
- [ ] Run all checks, review final diff, update roadmap/current work, and archive `.planning/archive/m6-ride-insights-portability/SUMMARY.md`.

## Verification

- [ ] `npm run typecheck`, `npm run lint`, and `npm test -- --watchAll=false` pass.
- [ ] No secrets, machine-local files, missing migrations/translations, layer leaks, or unrelated changes.
- [ ] Android dev-client verification is documented truthfully; no unperformed iOS/device check is claimed.

## Exit Criteria

The M6 definition of done is satisfied and the milestone can be archived as v0.3 complete.
