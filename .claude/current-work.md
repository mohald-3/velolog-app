# Current Work

## M1 — Bike Garage (v0.1a) — ACTIVE

**Phase 1 (done, 2026-07-10):** Project scaffold. expo-router (auto-detects `src/app`),
Drizzle ORM + expo-sqlite (dialect sqlite, driver expo), initial migration for `bikes` +
`components` tables scoped to what M1 needs. Root layout (`src/app/_layout.tsx`) runs
`useMigrations` with a loading/error state. Relocated the Spike 0 GPS screen into
`src/app/dev/gps-spike.tsx` (still reachable). Verified via `npm ci`, typecheck, lint, test,
and a full `expo export --platform android` (1345 modules). Along the way: added
`babel-preset-expo`/`babel-plugin-inline-import` as explicit top-level devDependencies (they
were only hoisted nested), and committed `.npmrc` (`legacy-peer-deps=true`) + a clean lockfile
regen after CI's `npm ci` first failed on lockfile drift. CI green. Issue #8 closed.

**Phase 2 (done, 2026-07-10):** Repository layer. `src/domain/types.ts` (Bike, Component,
New*/*Update variants, zero framework imports). `BikeRepository`/`ComponentRepository`
interfaces + Drizzle-backed implementations in `src/data/repositories/`. IDs via expo-crypto's
`randomUUID()`. No unit tests here (CRUD glue, not domain math — those start in M2). CI green,
issue #9 closed.

**Phase 3 (done, 2026-07-10):** Bike CRUD. Installed @tanstack/react-query + expo-image-picker.
`useBikes`/`useBike`/`useCreateBike`/`useUpdateBike`/`useArchiveBike` hooks. `BikeListScreen`
(empty state + FAB), `AddEditBikeScreen` (photo picker, starting odometer in km converted to
meters — keyed inner form component to avoid a set-state-in-effect lint error), `BikeDetailScreen`
(edit + archive with confirm). Routes wired under `src/app/bikes/`. CI green, issues #10 and
#12 closed.

**Phase 4 (next, final M1 phase):** Component CRUD attached to a bike (issue #11) + empty
states/nav polish (issue #13).

See `.planning/STATE.md` for the full plan.

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
_Last updated: 2026-07-10 (M1 Phase 3 bike CRUD done and closed; Spike 0 ride still pending for tomorrow)._
