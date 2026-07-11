# Current Work

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
_Last updated: 2026-07-11 (M2 complete incl. #21 follow-up, all 11 issues closed; Spike 0's two real-device items still pending)._
