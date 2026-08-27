# Feature: M6 — Ride Insights & Portability (v0.3)

> Created: 2026-08-27
> Status: In progress — Phase 3 ready
> Milestone: M6 (v0.3)
> GitHub milestone: [M6 - Ride Insights & Portability (v0.3)](https://github.com/mohald-3/velolog-app/milestone/7)
> GitHub project: [VeloLog Project](https://github.com/users/mohald-3/projects/18/views/1)

## Goal

Make completed rides more useful and portable while preserving VeloLog's local-first core: show
reliable elevation gain, exchange rides as GPX files, and visualize distance trends over time.

## Scope

### Included

- [ ] Record altitude for new GPS points and derive smoothed elevation gain for completed rides.
- [ ] Backfill elevation gain on demand for existing tracks that already contain usable altitude.
- [ ] Export an individual completed ride as standards-compatible GPX 1.1 through the native share sheet.
- [ ] Import GPX tracks from local device storage into a review flow, then save them as completed rides assigned to a selected bike.
- [ ] Show weekly and monthly distance charts, with all-bikes and per-bike filtering.
- [ ] Keep all calculations and file interchange usable without connectivity.
- [ ] Translate all new UI in English and Swedish and support metric/imperial units plus light/dark themes.

### Deferred

- Weather snapshots: deferred because they add the app's first network/API dependency.
- Ride photos: deferred because lifecycle, storage cleanup, and future sync semantics deserve a separate media-focused phase.
- GPX navigation, bulk transfer, FIT/TCX support, and cloud sync.

## Product Requirements

### Elevation gain

- [ ] New points include nullable altitude and vertical accuracy; old track files remain readable.
- [ ] Gain uses a pure, tested noise-rejection/smoothing pipeline, not every positive fluctuation.
- [ ] Missing or insufficient altitude is unavailable, never a misleading zero.
- [ ] Ride detail uses metres or feet according to settings.
- [ ] Nullable gain is stored as a recomputable ride summary for fast display.

### GPX export

- [ ] Produce GPX 1.1 with escaped metadata, timestamps, coordinates, and optional elevation.
- [ ] Write a temporary `.gpx`, share it natively, and report failures clearly.
- [ ] Never alter the ride or its append-only track.

### GPX import

- [ ] Select one local GPX file through the native document picker.
- [ ] Support common GPX 1.0/1.1 tracks/routes, namespaces, optional elevation/time, and multiple segments.
- [ ] Invalid/empty files create no row or permanent track file and show an actionable error.
- [ ] Review map, date/time, distance, duration, elevation, and bike before saving.
- [ ] If time is absent, collect date/duration and assign deterministic point timestamps.
- [ ] Save canonical NDJSON and a completed ride while reusing odometer/maintenance effects.
- [ ] Record `recorded` versus `gpx` provenance for future sync/debugging.

### Distance charts

- [ ] Show local-calendar weekly and monthly distance totals.
- [ ] Switch weekly/monthly range and all-bikes/single-bike scope.
- [ ] Represent empty periods consistently.
- [ ] Provide a textual accessible summary; do not rely on color alone.
- [ ] Follow locale and selected distance units.

## Technical Decisions

| Date | Decision | Rationale |
|---|---|---|
| 2026-08-27 | Scope M6 to elevation, GPX import/export, and distance charts | One cohesive offline ride-data release; weather and photos add unrelated infrastructure. |
| 2026-08-27 | Extend raw points with optional altitude/vertical accuracy | Optional fields preserve every existing NDJSON track. |
| 2026-08-27 | Persist nullable `elevationGainM` | It is an expensive track-derived summary; null distinguishes unknown from zero. |
| 2026-08-27 | Persist ride source (`recorded`/`gpx`) | Supports future sync and diagnosis without a separate import entity. |
| 2026-08-27 | Keep GPX parsing/serialization pure | Correctness stays unit-testable; services own document/file I/O. |
| 2026-08-27 | Use local calendar chart buckets | Trends match user-visible dates, including DST boundaries. |
| 2026-08-27 | Select a chart dependency after a Phase 1 spike | Expo 57 compatibility and accessibility must be verified first. |
| 2026-08-27 | Use `fast-xml-parser` 5.11 for GPX XML | Pure JavaScript, typed, namespace removal and forced-array paths passed GPX 1.0/1.1 Jest smoke tests. |
| 2026-08-27 | Use Expo-compatible `react-native-svg` 15.15.4 for a small owned bar chart | Avoids a full chart framework and its Skia/Reanimated coupling; verified in a rebuilt EAS Android dev client. |
| 2026-08-27 | Limit GPX import to 10 MiB and 100,000 points | Ample for long rides while bounding whole-document XML parsing memory. |

## Roadmap

### Phase 1: Contracts, spikes, and migration — medium

- [x] Define elevation behavior and fixtures.
- [x] Spike GPX XML parsing and a chart library in the Expo 57 development client.
- [x] Extend types/schema with nullable elevation and ride source; generate the migration.
- [x] Add elevation unit formatting.

Detail: `.planning/M6-PHASE-1.md`
Issue: [#48](https://github.com/mohald-3/velolog-app/issues/48)

### Phase 2: Elevation pipeline — medium

- [ ] Capture altitude and implement/test filtered elevation gain.
- [ ] Persist gain for recorded/imported rides and recompute eligible legacy rides.
- [ ] Show localized elevation on ride detail.

Detail: `.planning/M6-PHASE-2.md`
Issue: [#49](https://github.com/mohald-3/velolog-app/issues/49)

### Phase 3: GPX export — small

- [x] Implement/test GPX serialization and file/share service.
- [x] Add a translated Export GPX ride action.

Detail: `.planning/M6-PHASE-3.md`
Issue: [#50](https://github.com/mohald-3/velolog-app/issues/50)
Manual verification: [#58](https://github.com/mohald-3/velolog-app/issues/58) (before M6 release)

### Phase 4: GPX import — large

- [x] Implement/test tolerant parsing and normalized summaries.
- [x] Add document selection, review/preview, validation, and safe save.
- [x] Reuse ride invalidation, odometer, and maintenance behavior.

Detail: `.planning/M6-PHASE-4.md`
Issue: [#51](https://github.com/mohald-3/velolog-app/issues/51)
Manual verification: [#60](https://github.com/mohald-3/velolog-app/issues/60) (before M6 release)

### Phase 5: Distance insights — medium

- [x] Implement/test week/month aggregation and gap filling.
- [x] Add repository/hook support and an accessible filtered insights screen.

Detail: `.planning/M6-PHASE-5.md`
Issue: [#52](https://github.com/mohald-3/velolog-app/issues/52)
Manual verification: [#61](https://github.com/mohald-3/velolog-app/issues/61) (before M6 release)

### Phase 6: Integration and release readiness — medium

- [ ] Verify invariants, GPX interoperability, elevation plausibility, and the full UX matrix.
- [ ] Run all automated checks and Android development-client verification.
- [ ] Update roadmap/state and archive the completed milestone.

Detail: `.planning/M6-PHASE-6.md`
Issue: [#53](https://github.com/mohald-3/velolog-app/issues/53)

## Current Position

```
Phase: 6 of 6
Task:  0 of 3
Status: Phase 5 complete; Phase 6 ready
```

## Progress

[█████████████████░░░] 5/6 phases

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Altitude noise inflates climbing | Accuracy rejection, smoothing fixtures, and real-route comparison. |
| Existing tracks lack altitude | Keep gain nullable; backfill only usable tracks. |
| GPX producers vary | Fixture matrix, ignore unknown extensions, reject only unusable geometry. |
| Import double-counts/corrupts odometers | Review, double-tap guard, one create path, DB transaction, file cleanup. |
| Chart library is incompatible/inaccessible | Timeboxed spike and lightweight custom SVG fallback. |
| Large GPX causes memory pressure | Define byte/point limits during the spike. |
| DST/year boundaries skew charts | Pure boundary tests using local calendar semantics. |

## Definition of Done

- [ ] New outdoor rides show plausible gain; old rides without altitude remain valid.
- [ ] Exported GPX opens in an independent GPX app.
- [ ] Third-party GPX imports through preview/save, maps correctly, and updates odometer/maintenance once.
- [ ] Weekly/monthly charts correctly handle filters, units, empty periods, and accessibility.
- [ ] All core flows remain offline with no backend or mandatory network request.
- [ ] Typecheck, lint, and full tests pass.
- [ ] Android dev-client checks cover picker, sharing, preview, charts, themes, locales, and units.

## Session Log

| Date | Session | What happened |
|---|---|---|
| 2026-08-27 | Planning | Selected three cohesive features and created a six-phase plan. |
| 2026-08-27 | GitHub setup | Created milestone 7 and issues #48–#53; added them to project 18. |
| 2026-08-27 | Phase 1 | Started issue #48 on `feat/48-m6-contracts-spikes-migration`. |
| 2026-08-27 | Phase 1 complete | Contracts, migration, dependency spikes, and EAS Android SVG verification passed. |
| 2026-08-27 | Phase 2 | Started issue #49 on `feat/49-elevation-pipeline`. |
| 2026-08-27 | Phase 2 complete | Altitude capture, elevation persistence/recompute, and localized ride-detail states verified. |
| 2026-08-28 | Phase 3 implementation | GPX serialization, offline cache export, native sharing hook, and translated ride action completed; Android interoperability check remains. |
| 2026-08-28 | Phase 3 complete | Deferred Android share-sheet and independent-app verification to M6 issue #58; Phase 4 is ready. |
| 2026-08-28 | Phase 4 implementation | Tolerant GPX import, missing-time fallback, review UI, canonical persistence, and normal ride side effects completed; device verification remains. |
| 2026-08-28 | Phase 4 complete | Deferred Android picker and persistence verification to M6 issue #60. |
| 2026-08-28 | Phase 5 implementation | Local weekly/monthly aggregation, accessible SVG chart, filters, and Journey entry point completed; visual/device verification remains. |
| 2026-08-28 | Phase 5 complete | Deferred Android visual and accessibility verification to M6 issue #61; Phase 6 is ready. |
