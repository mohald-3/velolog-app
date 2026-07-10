# Feature: M1 — Bike Garage (v0.1a)

> Created: 2026-07-10
> Status: Phase 1 complete — Phase 2 next
> Milestone: M1 - Bike Garage (v0.1a)

## Goal

Add a bike with components, offline, surviving app restart — the first real product code,
establishing the architecture (domain/data/services/features/app) that everything else builds on.

## Requirements

- [x] Project scaffold: Expo + TypeScript + Drizzle + expo-sqlite, migrations (issue #8)
- [ ] Repository layer (interfaces now, so a synced implementation can swap in later) (issue #9)
- [ ] Bike CRUD (create, edit, archive) with photo (expo-image-picker) (issue #10)
- [ ] Component CRUD attached to a bike, with installedAtOdometer (issue #11)
- [ ] Bike detail screen: static odometer (manually settable initial value) (issue #12)
- [ ] Empty states + basic navigation (expo-router) (issue #13)

(Issues #8-#13 in `mohald-3/velolog-app`, milestone M1.)

## Roadmap

### Phase 1: Project scaffold — medium (DONE)
- [x] Installed expo-router + peer deps (react-native-safe-area-context, react-native-screens,
      expo-linking, expo-constants) — used `--legacy-peer-deps` since expo-router optionally
      pulls in web-only UI deps (vaul/@radix-ui) expecting react-dom, which a native-only app
      doesn't need
- [x] Installed expo-sqlite, drizzle-orm ^0.45.2, drizzle-kit ^0.31.10, babel-plugin-inline-import
- [x] Confirmed Expo Router auto-detects `src/app` as the routes root if that directory exists
      (no config needed — verified in `getRouterDirectory` in @expo/cli's metro/router.js)
- [x] `babel.config.js` with `inline-import` plugin for `.sql` (drizzle-kit's expo driver
      generates a `migrations.js` that imports raw SQL files as strings)
- [x] `drizzle.config.ts` (dialect: sqlite, driver: expo, schema: src/data/schema.ts, out: ./drizzle)
- [x] `src/data/schema.ts`: bikes + components tables (scoped to M1 — rides/maintenance tables
      come in M2/M4 when those features are actually built)
- [x] Generated initial migration (`npx drizzle-kit generate`) — 0000_outstanding_elektra.sql
- [x] `src/data/db.ts`: opens the sqlite db, wraps with `drizzle()`
- [x] `src/app/_layout.tsx`: root layout, runs `useMigrations`, shows loading/error state
- [x] Relocated the Spike 0 screen from `App.tsx` into `src/app/dev/gps-spike.tsx` (git rename,
      98% similarity) — still reachable via a link from the home screen
- [x] Updated entry point (`index.ts`): registers the background location task, then imports
      `expo-router/entry`; `package.json` "main" unchanged (still `index.ts`)
- [x] Verified: typecheck, lint, unit tests (passWithNoTests), and a full
      `expo export --platform android` bundle (1345 modules) all pass
- [x] Fixed two dependency issues found during verification: `babel-preset-expo` and
      `babel-plugin-inline-import` were only hoisted nested under other packages, not at the
      top level our own `babel.config.js` needs — added both as explicit devDependencies.
      Then CI's `npm ci` failed on a drifted lockfile from incremental `--legacy-peer-deps`
      installs — fixed by committing `.npmrc` (`legacy-peer-deps=true`) and regenerating the
      lockfile from a clean `node_modules`. Verified `npm ci` itself succeeds afterward.
- [x] Closed issue #8 with evidence; CI green on the final commit

### Phase 2: Repository layer — small (NEXT)
- [ ] `src/domain/types.ts`: Bike, Component domain types (scoped to what M1 needs)
- [ ] `src/data/repositories/bikeRepository.ts`: interface + Drizzle-backed implementation
- [ ] `src/data/repositories/componentRepository.ts`: interface + Drizzle-backed implementation
- [ ] Unit tests for anything that's pure logic (most of this phase is data-layer glue, not
      domain math — real domain-logic unit tests start in M2 with GPS filtering)

### Phase 3: Bike CRUD + detail screen — medium
- [ ] TanStack Query hooks (`useBikes`, `useBike`, `useCreateBike`, `useUpdateBike`, `useArchiveBike`)
- [ ] Bike list screen, add/edit screen with expo-image-picker photo, archive flow
- [ ] Bike detail screen: manually settable starting odometer

### Phase 4: Component CRUD + polish — medium
- [ ] Component CRUD attached to a bike (type enum, installedAtOdometer)
- [ ] Empty states across bike list / detail / component list
- [ ] Navigation polish (tabs vs stack — decide when the screen count is clearer)

## Current Position

```
Phase: 2 of 4
Task:  0 of 4 (repository layer not started)
Status: Phase 1 done and closed (issue #8); starting Phase 2
```

## Progress

[█████░░░░░░░░░░░░░░░░] 1/4 phases complete

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-10 | Scope `src/data/schema.ts` to bikes + components only for M1 | Rides/maintenance tables aren't needed until M2/M4; adding them now would be speculative, against the "don't build for hypothetical future requirements" convention |
| 2026-07-10 | Used `--legacy-peer-deps` for expo-router install | expo-router optionally depends on web-only UI packages (vaul/@radix-ui) expecting react-dom; this is a native-only, Android-first app per the plan, so that peer conflict is irrelevant noise, not a real problem |
| 2026-07-10 | Relocate the Spike 0 screen into the router tree instead of deleting it | Spike 0 issues #5/#6/#7 are still open (ride postponed to tomorrow); the already-installed APK on the phone is unaffected by source changes, but a future rebuild should still have the GPS test screen available |
| 2026-07-10 | Archived Spike 0's `.planning/STATE.md` to `.planning/archive/spike-0-gps-derisk/` | Starting a new active feature plan; our `/plan` workflow assumes one active `STATE.md` at a time |

## Session Log

| Date | Session | What happened |
|------|---------|---------------|
| 2026-07-10 | Planning + Phase 1 start | Archived Spike 0 plan, wrote this M1 plan. Installed expo-router + peers, expo-sqlite, drizzle-orm, drizzle-kit, babel-plugin-inline-import. Confirmed Expo Router's `src/app` auto-detection by reading @expo/cli source directly rather than assuming. Verified drizzle-orm's expo-sqlite driver/migrator API by reading its type declarations. Remaining Phase 1 work: babel/drizzle config, schema, migrations, db client, root layout, relocating the spike screen, and verifying the app actually boots. |
| 2026-07-10 | Phase 1 finished | Wrote babel.config.js, drizzle.config.ts, schema (bikes+components), generated the migration, db.ts client, root layout with useMigrations, relocated the spike screen, updated the entry point. Full bundle export (1345 modules) succeeded. Fixed two dependency issues (un-hoisted babel packages, then a drifted lockfile that broke CI's `npm ci`) with explicit devDependencies and a committed `.npmrc`. Closed issue #8. CI green. |
