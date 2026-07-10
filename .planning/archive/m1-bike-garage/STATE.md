# Feature: M1 — Bike Garage (v0.1a)

> Created: 2026-07-10
> Status: COMPLETE — all 4 phases done, milestone closed
> Milestone: M1 - Bike Garage (v0.1a)

## Goal

Add a bike with components, offline, surviving app restart — the first real product code,
establishing the architecture (domain/data/services/features/app) that everything else builds on.

## Requirements

- [x] Project scaffold: Expo + TypeScript + Drizzle + expo-sqlite, migrations (issue #8)
- [x] Repository layer (interfaces now, so a synced implementation can swap in later) (issue #9)
- [x] Bike CRUD (create, edit, archive) with photo (expo-image-picker) (issue #10)
- [x] Component CRUD attached to a bike, with installedAtOdometer (issue #11)
- [x] Bike detail screen: static odometer (manually settable initial value) (issue #12)
- [x] Empty states + basic navigation (expo-router) (issue #13)

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

### Phase 2: Repository layer — small (DONE)
- [x] `src/domain/types.ts`: Bike, Component domain types, New*/*Update variants — zero
      Drizzle/React/Expo imports
- [x] `src/data/repositories/bikeRepository.ts`: interface + Drizzle-backed implementation
      (list/getById/create/update/archive)
- [x] `src/data/repositories/componentRepository.ts`: interface + Drizzle-backed implementation
      (listByBike/getById/create/update/retire)
- [x] IDs via expo-crypto's `randomUUID()`
- [x] No unit tests added — this phase is CRUD glue against SQLite, not domain math; decided
      real domain-logic unit tests start in M2 with GPS filtering, per plan
- [x] Verified typecheck/lint/test/export all pass; closed issue #9, CI green

### Phase 3: Bike CRUD + detail screen — medium (DONE)
- [x] Installed @tanstack/react-query, expo-image-picker; QueryClientProvider wired into root layout
- [x] TanStack Query hooks (`useBikes`, `useBike`, `useCreateBike`, `useUpdateBike`, `useArchiveBike`)
      in `src/features/bikes/hooks/useBikes.ts`
- [x] `BikeListScreen`: empty state + list + FAB to add
- [x] `AddEditBikeScreen`: shared create/edit form, photo picker, starting-odometer-in-km input
      (converted to meters at the boundary). Inner `BikeForm` keyed by bike id (or 'new') so
      initial state comes from a prop at mount, not synced via useEffect — avoids the
      react-hooks/set-state-in-effect lint rule and matches React's own recommended pattern
- [x] `BikeDetailScreen`: odometer/year/color/frame/notes, edit + archive (with confirm dialog)
- [x] Routes: `src/app/index.tsx` (list), `src/app/bikes/{new,[id],[id]/edit}.tsx` — thin
      wrappers per the architecture rules, screens live in `features/`
- [x] Verified typecheck/lint/test/export all pass; closed issues #10 and #12, CI green

### Phase 4: Component CRUD + polish — medium (DONE)
- [x] `src/domain/wear.ts` + `wear.test.ts`: `computeComponentWearM`, pure, clamped at 0 —
      first real domain logic + unit test in the repo
- [x] Component hooks (`useComponents`, `useComponent`, `useCreateComponent`,
      `useUpdateComponent`, `useRetireComponent`) in `src/features/bikes/hooks/useComponents.ts`
- [x] `AddEditComponentScreen`: type as selectable chips, name, installed-at-odometer in km,
      installed date, optional expected lifetime + notes, retire action when editing
- [x] `BikeDetailScreen` Components section: empty state, list with derived wear-in-km, tap
      to edit, "+ Add" link
- [x] Routes: `src/app/bikes/[id]/components/{new,[componentId]/edit}.tsx`
- [x] Nav polish: static `options = { title }` across routes, dynamic bike-name title on the
      detail screen via `<Stack.Screen options={{ title }} />`. Decided to stay with a single
      Stack (no tabs) — only one feature exists yet; revisit once M2/M3 add Rides screens
- [x] Fixed a real gap: `@types/jest` wasn't resolving even though installed — needed explicit
      `"types": ["jest"]` in `tsconfig.json` (only surfaced once we had a first test file)
- [x] Verified typecheck/lint/test(4 passing)/export all pass; closed issues #11 and #13, CI green

## Current Position

```
All 4 phases complete. Milestone M1 closed (6/6 issues closed).
```

## Progress

[█████████████████████] 4/4 phases complete — MILESTONE COMPLETE

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
| 2026-07-10 | Phase 2 finished | Wrote domain/types.ts, bikeRepository.ts, componentRepository.ts with expo-crypto UUIDs. Typecheck/lint/test/export all pass, CI green. Closed issue #9. |
| 2026-07-10 | Phase 3 finished | Installed TanStack Query + expo-image-picker. Wrote bike hooks, BikeListScreen, AddEditBikeScreen (with a key-based remount to avoid a set-state-in-effect lint error), BikeDetailScreen, and the bikes/ routes. Typecheck/lint/test/export all pass, CI green. Closed issues #10 and #12. |
| 2026-07-10 | Phase 4 finished — M1 complete | Wrote domain/wear.ts + first unit tests, component hooks, AddEditComponentScreen, Components section on BikeDetailScreen, component routes, nav title polish. Fixed a real @types/jest resolution gap. Typecheck/lint/test/export all pass, CI green. Closed issues #11 and #13. All 6 M1 issues closed; milestone M1 closed. |
