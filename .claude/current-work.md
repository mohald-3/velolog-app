# Project Context

> Living summary — read at session start, update on every commit. Milestone detail lives in
> `.planning/archive/<milestone>/SUMMARY.md`; keep this file to one line per completed milestone.

## What the app is today

VeloLog v0.2 is feature-complete as an MVP: a local-first bike garage (bikes + components with
derived wear), background GPS ride recording with a filtered pipeline and crash recovery, ride
history with MapLibre track maps and bike statistics, mileage-driven maintenance rules with local
notifications, and a polish layer — km/mi units, Swedish/English i18n, dark mode, journey stats,
onboarding, real app icon + splash. 91 unit tests over `src/domain`. Android-first; iOS deferred.

## Milestone ledger

| Milestone | Status | Detail |
|---|---|---|
| M0 — Spike 0: GPS de-risk | 5/7 done (2026-07-10) | `.planning/archive/spike-0-gps-derisk/STATE.md` |
| M1 — Bike Garage (v0.1a) | ✅ 2026-07-10 · PR — | `.planning/archive/m1-bike-garage/SUMMARY.md` |
| M2 — Ride Recording (v0.1b) | ✅ 2026-07-11 · PR #39 | `.planning/archive/m2-ride-recording/SUMMARY.md` |
| M3 — Ride History & Stats (v0.1c) | ✅ 2026-07-11 · PR #40 | `.planning/archive/m3-ride-history/SUMMARY.md` |
| M4 — Maintenance (v0.2) | ✅ 2026-07-12 · PR #41 | `.planning/archive/m4-maintenance/SUMMARY.md` |
| M5 — Polish & "Your Journey" (v0.2) | ✅ 2026-07-12 · PR #42 | `.planning/archive/m5-polish-your-journey/SUMMARY.md` |

## Open items (real device required)

- **#5** Deliberate force-kill-from-recent-apps test on a real device (emulator force-stop was
  tested in M2, but not real-device OEM battery-killer behavior)
- **#6** Open-road GPS accuracy route to compare against the residential route already recorded

## Current focus — code quality & architecture pass (before M6)

Decided 2026-07-12: with the MVP serving its purpose, next effort goes to maintainability and
UX/UI rather than new features. Target architecture inspiration: GoDo mobile app (shared UI
primitives, size discipline), while keeping VeloLog's stricter domain purity.

Done so far:
- Feature-construction conventions written: CLAUDE.md "Building a feature" section +
  `.claude/patterns/` scaffold templates (domain module, repository, hook, screen+route)
- Decisions: shared primitives will live in `src/components/` (rule of three), soft ~200-line
  file guideline (excluding `createStyles`)
- Full-codebase review done — findings tracked in issue #43 (A correctness / B conventions /
  C maintainability / D minor)
- A-batch fixed on `fix/code-review-correctness`: stop-vs-save ride-loss window (pointer now
  cleared only after DB save, retry alert on failure), true file append instead of full rewrite,
  transactional replace-component and mark-as-done, corrupt-JSON guards on recovery paths,
  double-tap-Stop guard

Next:
1. Issue #43 B-batch: i18n for notifications + enum labels, move `componentTypeValues` to
   domain, move `tasks/` under `src/services/`
2. Issue #43 C-batch: extract shared UI primitives into `src/components/` (Field ×3, Stat ×4,
   buttons ×6...), centralize query keys, shared mutation-error feedback
3. UX/UI pass after the code is settled (includes D3 BikeDetail header actions)

## After that

M6 — v0.3 candidates (pick 2–3, not all): GPX export/import, distance charts, elevation gain,
weather snapshot on ride save (first optional network dependency), ride photos.

---
_Last updated: 2026-07-12 (conventions docs written; code review pass is next)._
