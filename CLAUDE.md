# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project context (keep current)

`.claude/current-work.md` is the living project summary: what the app is today, the milestone
ledger, open items, and current focus.

- **At session start:** read it silently; mention it only if there is unfinished work.
- **On every commit:** update it — what changed, current focus, next step — and include it in
  the commit.
- **On milestone/feature completion:** archive the detail in `.planning/archive/<name>/SUMMARY.md`
  and keep only a one-line ledger entry in `current-work.md`. Never let it grow into a log.

## Project

VeloLog — a local-first bike computer / maintenance tracker app. "Strava tracks you. VeloLog tracks your bike." See `docs/PROJECT_PLAN.md` for full context: vision, domain model, roadmap, non-goals.

Non-goals, permanently: social features (followers/likes/clubs/leaderboards), subscriptions, turn-by-turn navigation.

## Stack

- Expo SDK 54+, React Native, TypeScript
- expo-sqlite + Drizzle ORM (typed schema + migrations)
- expo-location + expo-task-manager (background GPS)
- MapLibre (`@maplibre/maplibre-react-native`) + OpenFreeMap tiles
- TanStack Query + Zustand (or plain context) for state/data
- expo-notifications for local maintenance reminders
- EAS Build + dev client (background location requires a dev build, not Expo Go)

## Architecture rules (non-negotiable)

**Principle: GODO's discipline, not GODO's structure.** Clean Architecture/CQRS/MediatR are server patterns for a large API; they are NOT applied to this mobile app. What transfers is domain purity, the repository pattern, and one-way dependencies.

```
src/
  domain/        # PURE TypeScript: types, gps-filter.ts, wear.ts,
                 # odometer.ts, stats.ts — zero imports from React/Expo/DB
  data/          # drizzle schema, migrations, repository implementations
  services/      # location-task.ts (background tracking), notifications.ts
  features/      # bikes/, rides/, maintenance/ — screens + hooks per feature
  components/    # shared UI primitives (extracted when used by 3+ screens)
  theme/         # ThemeColors palette + useTheme() (presentation, not domain)
  i18n/          # i18next setup + en.json / sv.json resources
  app/           # expo-router routes — logic-free stubs only
```

1. All ride math and maintenance logic (GPS filtering, haversine accumulation, moving-time detection, component wear, rule due-status, odometer recompute) are **pure functions in `src/domain`** with unit tests. No React, Expo, or database imports there, ever.
2. UI never touches Drizzle directly. All data access goes through repository interfaces (`BikeRepository`, `RideRepository`, ...). This is the seam where cloud sync (Phase S) plugs in later without touching screens.
3. Dependency direction: `features → services/data → domain`. Domain depends on nothing.
4. TanStack Query hooks calling repositories ARE the application layer. No CQRS, no mediator, no use-case classes, no dependency-injection framework.
5. Feature folders own their screens and hooks; shared UI primitives only when actually shared.

## Local-first

The app must work with zero connectivity — record a full ride in a forest with no signal. There is no backend in v0.1–v0.3. When a backend eventually arrives (Phase S), it is a sync target, never a dependency. Never introduce a network call as a hard dependency for a core flow (recording a ride, viewing bikes/history, maintenance status).

Domain invariants worth remembering when touching ride/bike code:
- Completing a ride increments the bike's odometer by `ride.distanceM`.
- Component wear and rule due-status are always *derived* from odometer — never stored counters that can drift.
- Rides are append-only after completion (editable: notes, bike assignment; never GPS track data).
- Rides are soft-deleted (`deletedAt`), never hard-deleted. Deletion triggers a recompute of bike odometer and rule due-status.

## Building a feature

Construction order: **domain → schema/repository → hooks → screen → route**. Each step has a scaffold template in `.claude/patterns/` — read the matching one before creating a new file of that kind:

| Step | Location | Template |
|---|---|---|
| Domain logic + tests | `src/domain/<name>.ts` + `.test.ts` | `domain-module-template.md` |
| Table + migration + repository | `src/data/` (`npx drizzle-kit generate`) | `repository-template.md` |
| TanStack Query hooks | `src/features/<feature>/hooks/` | `hook-template.md` |
| Screen + route stub | `src/features/<feature>/screens/` + `src/app/` | `screen-template.md` |

Non-negotiables baked into those templates:

- Every screen: i18n via `t()` (keys added to both `en.json` and `sv.json` in the same commit), `useTheme` + memoized `createStyles(colors)` factory (no inline styles, no raw hex), safe-area bottom padding on scrollables, loading + empty states, distance/speed through `formatDistance`/`formatSpeed` with the unit setting.
- Page actions are header icons; extras behind a "⋮" overflow that opens a real anchored dropdown — never bottom buttons.
- Route files are logic-free stubs that render the feature screen.
- **Size guideline:** ~200 lines per file (excluding `createStyles`) is the "consider splitting" threshold — extract subcomponents or hooks instead of growing past it.
- Shared UI primitives live in `src/components/` — check it before hand-rolling a card/button/form row; extract a primitive there when the same pattern appears on a third screen.

## Conventions

- **Conventional commits** (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, ...), short-lived branches.
- **Unit tests are required for all domain logic** (`src/domain/**`) — especially GPS filtering, wear/due calculations, and odometer invariants. This is the most test-worthy code in the app; UI tests are deferred, real-ride field testing is the integration test.
