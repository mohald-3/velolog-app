# CLAUDE.md

Guidance for Claude Code when working in this repository.

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
  app/           # expo-router routes
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

## Conventions

- **Conventional commits** (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, ...), short-lived branches.
- **Unit tests are required for all domain logic** (`src/domain/**`) — especially GPS filtering, wear/due calculations, and odometer invariants. This is the most test-worthy code in the app; UI tests are deferred, real-ride field testing is the integration test.
