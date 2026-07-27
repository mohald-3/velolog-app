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

Next (active as of 2026-07-27, resume here):
1. Real-device field ride: cold-start #45 scenario + Spike 0's two open items (#5 kill test,
   #6 open-road accuracy)
2. Then M6 (v0.3 candidates — pick 2–3)

## After that

M6 — v0.3 candidates (pick 2–3, not all): GPX export/import, distance charts, elevation gain,
weather snapshot on ride save (first optional network dependency), ride photos.

---
_Last updated: 2026-07-27 (UX/UI pass complete; real-device field ride is next)._
