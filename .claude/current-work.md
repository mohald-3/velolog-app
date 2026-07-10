# Current Work

## M1 — Bike Garage (v0.1a) — COMPLETE (2026-07-10)

All 4 phases done, all 6 issues (#8-#13) closed, milestone closed. Scaffold (expo-router +
Drizzle/expo-sqlite), repository layer, and full Bike + Component CRUD with derived wear.
First real domain logic + unit test (`src/domain/wear.ts`). Full summary archived at
`.planning/archive/m1-bike-garage/SUMMARY.md`.

No active feature plan right now. Next up is M2 — Ride Recording (v0.1b): the recording state
machine and the GPS filtering pipeline (the big one — `src/domain` gets its next and much
larger set of pure functions + unit tests per CLAUDE.md's testing conventions).

---

## Spike 0 — GPS de-risk (M0) — paused, resume 2026-07-11

4/7 issues closed (#1 EAS build, #2 background tracking, #3 30+ min recording, #4 battery
~2.3%/hour — well under the <8-10%/hour target). First successful field test: 39.4 min walk,
485 points, no crashes, clean data.

**Still open, postponed to tomorrow (ride needed):**
- **#5** Deliberate force-kill-from-recent-apps test (the walk only showed screen-lock/stopped
  survival, not an explicit kill)
- **#6** An open-road route to compare against the residential/office-area one already tested
- **#7** Actually rendering the track on a map (only did stats analysis so far) to help pick
  MapLibre vs react-native-maps

Full detail archived at `.planning/archive/spike-0-gps-derisk/STATE.md`.

---
_Last updated: 2026-07-10 (M1 complete and archived; Spike 0 ride still pending for tomorrow)._
