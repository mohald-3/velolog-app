# Project Context

Repository overview: `README.md` documents the product, features, architecture, local setup,
privacy model, and roadmap for developers and portfolio visitors.
Current tagline: “VeloLog adds the story of your bike.”

> Living summary — read at session start, update on every commit. Milestone detail lives in
> `.planning/archive/<milestone>/SUMMARY.md`; keep this file to one line per completed milestone.

## What the app is today

VeloLog v0.2 is feature-complete as an MVP: a local-first bike garage (bikes + components with
derived wear), background GPS ride recording with a filtered pipeline and crash recovery, ride
history with MapLibre track maps and bike statistics, mileage-driven maintenance rules with local
notifications, and a polish layer — km/mi units, Swedish/English i18n, dark mode, journey stats,
onboarding, real app icon + splash. 129 unit tests across domain, service, and ride formatting modules.
Android-first; iOS deferred.

## Milestone ledger

| Milestone | Status | Detail |
|---|---|---|
| M0 — Spike 0: GPS de-risk | ✅ 2026-08-04 | `.planning/archive/spike-0-gps-derisk/STATE.md` |
| M1 — Bike Garage (v0.1a) | ✅ 2026-07-10 · PR — | `.planning/archive/m1-bike-garage/SUMMARY.md` |
| M2 — Ride Recording (v0.1b) | ✅ 2026-07-11 · PR #39 | `.planning/archive/m2-ride-recording/SUMMARY.md` |
| M3 — Ride History & Stats (v0.1c) | ✅ 2026-07-11 · PR #40 | `.planning/archive/m3-ride-history/SUMMARY.md` |
| M4 — Maintenance (v0.2) | ✅ 2026-07-12 · PR #41 | `.planning/archive/m4-maintenance/SUMMARY.md` |
| M5 — Polish & "Your Journey" (v0.2) | ✅ 2026-07-12 · PR #42 | `.planning/archive/m5-polish-your-journey/SUMMARY.md` |

## Current focus — code quality & architecture pass (before M6)

Decided 2026-07-12: with the MVP serving its purpose, next effort goes to maintainability and
UX/UI rather than new features. Target architecture inspiration: GoDo mobile app (shared UI
primitives, size discipline), while keeping VeloLog's stricter domain purity.

Done (all merged to main 2026-07-13 — PRs #44, #46, #47):
- Feature-construction conventions: CLAUDE.md "Building a feature" section + `.claude/patterns/`
  scaffold templates (domain module, repository, hook, screen+route)
- Full-codebase review — findings tracked in issue #43; A (correctness: ride-loss window, true
  file append, transactions, recovery guards, double-tap guard), B (conventions: notification +
  enum-label i18n, layering fixes, tasks/ → src/services/), and C (maintainability:
  `src/components/` primitives with all 14 screens converted, `src/features/queryKeys.ts`,
  global mutation error alert) are all checked off in the issue
- #45 fixed: stale-first-GPS-fix re-anchoring in `gps-filter.ts` (found via live emulator
  verification, 6 new unit tests — suite now 97)
- Live emulator verification of the whole arc passed (record → stop → save, forms, badges,
  translated labels, discard flow)

Done:
- **UX/UI pass:** ✅ 2026-07-27 — formatting/title/locale polish, shared header overflow menus,
  metre-based component lifetime with visible wear progress, and a full light/dark emulator
  sweep. See `.planning/archive/ux-ui-pass/SUMMARY.md`.

Done:
- **Real-device GPS validation:** ✅ 2026-08-04 — cold-start #45 scenario, deliberate
  force-kill behavior (#5), and open-road accuracy comparison (#6) all passed.

Done:
- **Project documentation:** application-flow and developer-guide Word documents added, with
  the archived GPS spike and project roadmap reconciled to completed real-device validation.

Done:
- **M6 Phase 1 (#48):** shared contracts, elevation algorithm, migration, and native dependency
  validation.
- **M6 Phase 2 (#49):** altitude capture, elevation-gain persistence/recomputation, and localized
  ride-detail presentation, including safe handling of legacy tracks.
- **M6 Phase 3 (#50):** deterministic offline GPX 1.1 export through Android sharing; manual
  interoperability coverage is deferred to M6 issue #58.
- **M6 Phase 4 (#51):** tolerant offline GPX import with review, missing-time fallback, safe
  canonical persistence, and normal ride side effects; Android coverage is deferred to #60.
- **M6 Phase 5 (#52):** local weekly/monthly distance insights with gap filling, bike filters,
  unit-aware SVG visualization, and textual accessibility; device coverage is deferred to #61.

Next:
1. Execute M6 Phase 6 (#53): integration checks, deferred device verification, and release readiness.

## After that

M6 — v0.3 planned scope: GPX export/import, distance charts, and elevation gain. Weather snapshot
and ride photos remain deferred candidates.

---
_Last updated: 2026-08-28 (M6 Phase 5 complete; Phase 6 is next)._
