# Current Work

## M4 — Maintenance (v0.2) — COMPLETE (2026-07-12)

All 3 phases done, all 6 issues closed (#29-#34), milestone closed. `MaintenanceRule` domain
(due-status derivation, never a stored counter) with CRUD and sensible presets, local
notifications via `expo-notifications` when a rule crosses into DueSoon/Overdue, "Mark as done"
flow creating a `MaintenanceRecord` and resetting the rule's counter, per-component maintenance
log, and a component replacement flow (retire old, install new at current odometer, migrate
active rules with their counter reset). Also fixed a latent bug: `AddEditComponentScreen` was
using the bike's starting odometer baseline instead of the actual ride-derived current odometer.
Fully verified live end-to-end, including the milestone's signature exit criteria: recorded a
real ride via mocked GPS that pushed a rule into DueSoon and confirmed the actual Android
notification fired. Survived a severe emulator slowdown mid-session (fixed by fully restarting
the AVD; all data was intact since SQLite persists independent of the emulator process). Full
summary archived at `.planning/archive/m4-maintenance/SUMMARY.md`. PR: #41.

No active feature plan right now. Next up: M5 — Polish & "Your Journey" (v0.2): journey stats
screen (distance equivalence, cost per km, CO₂ saved, calories), onboarding for first bike, units
setting + Swedish/English i18n, app icon/splash/dark mode pass.

---

## M3 — Ride History & Statistics (v0.1c) — COMPLETE (2026-07-11)

All 3 phases done, all 4 issues closed (#25-#28), milestone closed. Ride list grouped by day,
ride detail with MapLibre track polyline + full stats + editable notes, bike statistics screen,
soft-delete with automatic odometer recomputation. Also fixed an app-wide bug found during live
verification: no `SafeAreaProvider` anywhere, so bottom-of-screen content rendered underneath
the Android edge-to-edge nav bar and was untappable — fixed across 6 screens. Ride detail's page
actions (share, delete) ended up entirely in the header (share icon + "⋮" overflow dropdown) per
live user feedback. Full summary archived at `.planning/archive/m3-ride-history/SUMMARY.md`.
PR: #40.

No active feature plan right now. Next up: M4 — Maintenance (v0.2): `MaintenanceRule` CRUD with
sensible presets, due-status computation, local notifications, mark-as-done flow, maintenance
log, component replacement.

---

## M2 — Ride Recording (v0.1b) — COMPLETE (2026-07-11)

All 5 phases done, all 11 issues closed (#14-#24) — **#21** (GPS filter optional auto-pause
toggle) was closed same-day as a quick follow-up after the initial 5 phases (the toggle needed
both a slow-segment check and a staleness fallback for genuine dead-stops, since a real stop
produces no GPS points at all with `distanceInterval: 5`). GPS filtering pipeline, recording
state machine, foreground recording screen with live stats, background continuation +
crash/kill recovery (verified live: force-stopped the app mid-recording, confirmed correct
rehydration), and the save flow (persists rides, fixed the bike detail screen to show the
derived odometer/wear instead of the raw starting value). Full summary archived at
`.planning/archive/m2-ride-recording/SUMMARY.md`. PR: #39.

No active feature plan right now. Next up: M3 — Ride History & Statistics (v0.1c): ride list,
ride detail with the recorded track on the map, bike statistics screen, soft-delete.

---

## M1 — Bike Garage (v0.1a) — COMPLETE (2026-07-10)

All 4 phases done, all 6 issues (#8-#13) closed, milestone closed. Scaffold (expo-router +
Drizzle/expo-sqlite), repository layer, and full Bike + Component CRUD with derived wear.
First real domain logic + unit test (`src/domain/wear.ts`). Full summary archived at
`.planning/archive/m1-bike-garage/SUMMARY.md`.

---

## Spike 0 — GPS de-risk (M0) — paused, resume needed

5/7 issues closed (#1 EAS build, #2 background tracking, #3 30+ min recording, #4 battery
~2.3%/hour — well under the <8-10%/hour target, #7 map rendering — resolved via the M2
track-map dev screen, MapLibre picked). First successful field test: 39.4 min walk, 485
points, no crashes, clean data.

**Still open (needs a real device, not the emulator):**
- **#5** Deliberate force-kill-from-recent-apps test on a real device (M2's emulator
  force-stop test covers the new ride-recording flow's recovery logic, but not real-device
  OEM battery-killer behavior, which is what this issue is actually about)
- **#6** An open-road route to compare against the residential/office-area one already tested

Full detail archived at `.planning/archive/spike-0-gps-derisk/STATE.md`.

---
_Last updated: 2026-07-12 (M4 complete, all 6 issues closed, milestone closed; Spike 0's two real-device items still pending)._
