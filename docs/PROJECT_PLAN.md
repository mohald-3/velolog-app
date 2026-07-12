# Bike Computer App — Project Plan

**Working name:** VeloLog (placeholder — rename freely)
**Owner:** Mohanned
**Date:** 2026-07-07
**Status:** v0.2 complete (Spike 0 through M5 shipped); M6 (v0.3) not yet started

---

## 1. Vision

A personal cycling companion focused on **your bike, not the community**. A digital garage plus ride tracker where every ride automatically feeds the bike's odometer, and maintenance reminders are driven by mileage instead of dates.

**One-line pitch:** "Strava tracks you. VeloLog tracks your bike."

### Non-goals (explicitly out of scope, permanently)

- Social features: followers, likes, comments, clubs, challenges, leaderboards, badges
- Subscriptions or premium tiers
- Turn-by-turn navigation

These are not deferred features. They are rejected features. This keeps scope honest.

---

## 2. Why this project (portfolio rationale)

- Demonstrates **mobile production skills** beyond CRUD: background GPS, offline-first storage, signal filtering, battery management, local notifications.
- Demonstrates **domain modeling**: component wear, odometer propagation, maintenance intervals.
- Later phases demonstrate **backend + sync**: Clean Architecture .NET API, conflict handling, append-only ride upload.
- It is a real product Mohanned will use, which shows in the polish.

Interview talking points this project generates: GPS noise filtering, foreground services on Android, offline-first architecture, sync strategy design, and store deployment (second shipped app after GODO).

---

## 3. Technology decisions

| Area | Choice | Rationale |
|---|---|---|
| Mobile framework | **React Native + Expo (SDK 54+), TypeScript** | Existing production experience (GODO app, both stores). MAUI rejected: new framework, weaker GPS/maps ecosystem, no EAS equivalent familiarity. |
| Build/deploy | **EAS Build + dev client** | Background location requires a development build (not Expo Go). Already familiar from GODO. |
| Local database | **expo-sqlite + Drizzle ORM** | Offline-first is non-negotiable for a ride tracker. Drizzle gives typed schema + migrations in TS. |
| GPS | **expo-location + expo-task-manager** | Background tracking via Android foreground service / iOS background location mode. |
| Maps | **MapLibre (@maplibre/maplibre-react-native) + OpenFreeMap tiles** — DECIDED | No Google Cloud/billing/API key, offline region support fits local-first, vector styling for dark mode. Fallback: react-native-maps if MapLibre misbehaves in Spike 0 (cheap swap, polyline-only usage). |
| State/data | **TanStack Query + Zustand (or plain context)** | TanStack Query already in stack; used against local repositories, later against API. |
| Notifications | **expo-notifications** | Local notifications for maintenance reminders. No push infra needed until sync phase. |
| Backend (Phase S, later) | **ASP.NET Core (.NET 10), Clean Architecture, CQRS/MediatR, EF Core, PostgreSQL** | Reuse GODO structure. Only introduced when cloud sync begins. |
| Backend hosting (later) | Railway + Supabase Postgres | Matches existing deployment plan from other project. |

**Key architectural principle: local-first.** The app must record a 2-hour ride in a forest with zero connectivity. The backend is a sync target, never a dependency. v0.1–v0.3 ship with **no backend at all**.

---

## 4. Domain model

### Entities

**Bike**
- id, name, brand, model, year, color, frameSize
- purchaseDate, purchasePrice, currency
- photoUri, notes
- isDefault, isArchived
- *Derived (not stored):* totalDistance, totalRideTime, rideCount, longestRide — computed from rides, cached if needed.

**Component**
- id, bikeId (FK)
- type (enum: Chain, Cassette, BrakePadsFront, BrakePadsRear, TireFront, TireRear, Custom)
- name, installedAtOdometer (bike km when installed), installedDate
- expectedLifetimeKm (nullable), notes, isRetired
- *Derived:* currentWearKm = bike.odometer − installedAtOdometer − (sum of odometer offsets if replaced)

**MaintenanceRule**
- id, componentId (FK)
- action (e.g. "Lubricate", "Inspect", "Replace")
- intervalKm
- lastPerformedAtOdometer
- *Derived:* dueInKm = (lastPerformedAtOdometer + intervalKm) − bike.odometer; status = OK / DueSoon / Overdue

**MaintenanceRecord** (event log)
- id, componentId (FK), ruleId (nullable FK)
- action, performedAtOdometer, performedDate, cost, notes
- Performing a record resets the matching rule's counter.

**Ride**
- id, bikeId (FK)
- startedAt, endedAt
- distanceM, elapsedS, movingS
- avgSpeedKmh (moving), maxSpeedKmh (filtered)
- elevationGainM (nullable, v0.3)
- notes, status (Recording / Paused / Completed / Discarded)

**RideTrack**
- id, rideId (FK, 1:1)
- points stored as **one compressed batch**, not row-per-point: either encoded polyline + parallel arrays (timestamps, speeds, accuracy) as JSON/blob, or gzipped JSON.
- Rationale: 2h ride @ 1 Hz = 7,200 points; never queried individually, only as a series.

**Settings** — key-value store, not a modeled entity. (units, auto-pause threshold, GPS accuracy mode, default bike)

### Core invariants

1. Completing a ride increments the bike's odometer by ride.distanceM.
2. Component wear and rule due-status are always derived from odometer, never stored counters that can drift.
3. Rides are append-only after completion (editable: notes, bike assignment; never GPS data).
4. Rides are **soft-deleted** (deletedAt on Ride) — DECIDED. All derived stats (odometer, bike statistics, rule due-status) exclude soft-deleted rides, so deletion triggers a recompute of bike odometer and rule statuses.

---

## 5. Mobile app architecture

**Principle: GODO's discipline, not GODO's structure.** Clean Architecture/CQRS/MediatR are server patterns for a large API; they are NOT applied to the mobile app. What transfers is domain purity, the repository pattern, and one-way dependencies. (The Phase S .NET backend, when it comes, DOES reuse the full GODO layering.)

```
src/
  domain/        # PURE TypeScript: types, gps-filter.ts, wear.ts,
                 # odometer.ts, stats.ts — zero imports from React/Expo/DB
  data/          # drizzle schema, migrations, repository implementations
  services/      # location-task.ts (background tracking), notifications.ts
  features/      # bikes/, rides/, maintenance/ — screens + hooks per feature
  app/           # expo-router routes
```

Rules (these go verbatim into CLAUDE.md):

1. All ride math and maintenance logic (GPS filtering, haversine accumulation, moving-time detection, component wear, rule due-status, odometer recompute) are **pure functions in src/domain** with unit tests. No React, Expo, or database imports there, ever.
2. UI never touches Drizzle directly. All data access goes through repository interfaces (BikeRepository, RideRepository, ...). This is the seam where Phase S cloud sync plugs in without touching screens.
3. Dependency direction: features → services/data → domain. Domain depends on nothing.
4. TanStack Query hooks calling repositories ARE the application layer. No CQRS, no mediator, no use-case classes, no dependency-injection framework.
5. Feature folders own their screens and hooks; shared UI primitives only when actually shared.

---

## 6. Roadmap

### Spike 0 — GPS de-risk (before any product code)

**Goal:** prove background tracking works acceptably on a real Android device.
**Timebox:** ~1 week of evenings.

- [x] EAS dev build with expo-location + expo-task-manager
- [x] Background tracking with Android foreground service notification
- [x] Record a real 30+ min outdoor ride; log raw points
- [x] Measure battery drain per hour — ~2.3%/hour, well under target
- [ ] Test app-killed / screen-off / phone-locked scenarios — screen-lock survival looks good; deliberate force-kill test still open (needs a real outdoor ride)
- [ ] Evaluate accuracy: urban vs open road — one route measured so far; contrasting open-road route still open
- [x] Pick maps library by rendering the recorded track — MapLibre

**Exit criteria:** a real ride recorded start-to-finish with screen off, < ~8–10% battery/hour, track visually sane on a map. If this fails, the whole plan is re-evaluated — that is the point of doing it first.

**Known risks investigated here:** OEM battery killers (Samsung/Xiaomi aggressive doze), iOS background suspension, GPS drift indoors at start.

---

### M1 — Bike Garage (v0.1a)

- [x] Project scaffold: Expo + TypeScript + Drizzle + expo-sqlite, migrations
- [x] Repository layer (interfaces now, so a synced implementation can swap in later)
- [x] Bike CRUD (create, edit, archive) with photo (expo-image-picker)
- [x] Component CRUD attached to a bike, with installedAtOdometer
- [x] Bike detail screen: static odometer (manually settable initial value — people have existing bikes with existing km)
- [x] Empty states + basic navigation (expo-router)

**Exit criteria:** add Trek FX 2 with a chain and two tires, set starting odometer to e.g. 400 km, survive app restart.

---

### M2 — Ride Recording (v0.1b) — the heart

- [x] Recording state machine: Idle → Recording → Paused → Recording → Completed/Discarded
- [x] Foreground recording with live stats (distance, duration, current/avg speed)
- [x] Background continuation (from Spike 0 learnings)
- [x] **GPS filtering pipeline:**
  - [x] drop points with accuracy worse than threshold (~25 m)
  - [x] drop implausible jumps (speed cap ~90 km/h between points)
  - [x] haversine distance accumulation over filtered points
  - [x] moving-time detection (speed < ~2 km/h = paused for movingS)
  - [x] optional auto-pause toggle
- [x] Crash/kill recovery: persist points incrementally so a killed app can resume or salvage the ride
- [x] Save ride → odometer update → component wear updates (invariant #1 and #2)
- [x] Discard ride flow

**Exit criteria:** three real outdoor rides recorded with believable stats (max speed sane, distance within ~2% of a reference app), odometer correct afterwards.

**Testing note:** the filtering pipeline is pure functions — unit test it hard with synthetic noisy tracks. This is the most test-worthy code in the app.

---

### M3 — Ride History & Statistics (v0.1c)

- [x] Ride list grouped by day (distance, duration, avg speed)
- [x] Ride detail: map with track polyline, full stats, notes field
- [x] Bike statistics screen: total distance, longest ride, total time, average ride, ride count
- [x] Soft-delete ride (deletedAt) with odometer + rule-status recomputation

**Exit criteria:** the six MVP actions all work: add bike → start → ride → stop → see stats → odometer updated.

---

### M4 — Maintenance (v0.2) — the differentiator

- [x] MaintenanceRule CRUD with sensible presets (chain lube 200 km, chain replace 3,000 km, brake pad check 1,000 km…)
- [x] Due-status computation after every completed ride
- [x] Local notification when a rule crosses into DueSoon/Overdue
- [x] "Mark as done" → MaintenanceRecord created, rule counter reset
- [x] Maintenance log view per component (history + cost)
- [x] Component replacement flow (retire old, install new at current odometer)

**Exit criteria:** ride past a chain-lube threshold → notification fires → mark done → status resets. Full loop.

---

### M5 — Polish & "Your Journey" (v0.2)

- [x] Journey stats screen: total distance with real-world equivalence ("Stockholm → Copenhagen ✓"), cost per km (purchase + maintenance costs / km), CO₂ saved vs car, calories estimate
- [x] Onboarding for first bike
- [x] Units setting (km/mi), Swedish + English i18n (long-standing interest — cheap to add early, painful late)
- [x] App icon, splash, dark mode pass

**Exit criteria:** would not be embarrassed to show a recruiter or put on Google Play internal testing.

---

### M6 — v0.3 candidates (pick 2–3, not all)

- GPX export (easy, high utility) and import
- Charts: distance per week/month (victory-native or similar)
- Elevation gain (from GPS altitude, needs smoothing)
- Weather snapshot on ride save (needs one API call — first network dependency, keep optional)
- Ride photos

---

### Phase S — Cloud Sync & Backend (v1.0, separate plan when reached)

- ASP.NET Core Web API, Clean Architecture, CQRS/MediatR, EF Core, PostgreSQL
- Auth (likely simple email or BankID-adjacent later; decide then)
- Sync strategy:
  - Rides/tracks/records: **append-only upload** — no conflicts by design
  - Bikes/components/rules: last-write-wins with updatedAt, per-entity
- Multi-device restore
- Deploy: Railway + Supabase

Deliberately unplanned in detail now. The mobile repository interfaces from M1 are the seam where sync plugs in.

---

## 7. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Background tracking unreliable on target device | Medium | Fatal | Spike 0 before anything else |
| OEM battery optimization kills service | High (Samsung/Xiaomi) | High | Foreground service + notification; in-app guidance to whitelist; test on real device |
| iOS background location review friction | Medium | Medium | Android-first; iOS after M3 |
| GPS noise makes stats look broken | High | High | Filtering pipeline + unit tests in M2 |
| Scope creep toward Strava | Medium | Medium | Non-goals section is contractual |
| Battery drain complaints (self) | Medium | Medium | Tunable accuracy/interval; measure in Spike 0 |
| Motivation dip mid-project | Medium | High | Each milestone ships something personally usable; M2 exit = app is already useful |

## 8. Ways of working

- **GitHub Project board** (same approach as GODO/Arbetsförmedlingen planning): columns Backlog / Milestone-scoped / In progress / Done; issues per checklist item above.
- **One repo** for mobile (`velolog-app`); backend gets its own repo in Phase S.
- CI: GitHub Actions — typecheck, lint, unit tests on PR. EAS builds triggered manually until M5.
- **Testing focus:** unit-test the pure domain logic (GPS filtering, wear/due calculations, odometer invariants). UI tests deferred; real-ride field testing is the integration test.
- Conventional commits, short-lived branches.

## 9. Definition of done (project-level, v0.2)

1. Add a bike with components — works offline, survives restarts
2. Record real rides in the background with believable statistics
3. Odometer and component wear update automatically
4. At least one maintenance reminder fires from real riding
5. Ride history with maps
6. On a real device via EAS internal distribution, used weekly by its author

---

## 10. Immediate next steps

1. ~~Open decisions~~ Both resolved: MapLibre + OpenFreeMap (fallback react-native-maps), soft-delete for rides. Platform: **Android-first**; iOS deferred until after M3.
2. ~~Create repo + GitHub Project board, import milestones as issues~~ Done.
3. ~~Start Spike 0~~ Done — background GPS proven (~2.3%/hour battery). Two real-device items remain open: deliberate force-kill test, and an open-road (vs. residential) accuracy comparison — both need an actual outdoor ride.
4. ~~M1–M5 (v0.1a through v0.2)~~ All shipped — see `.planning/archive/*/SUMMARY.md` per milestone.
5. **Next up:** M6 (v0.3 candidates — pick 2–3: GPX export/import, distance charts, elevation gain, weather snapshot, ride photos), and/or closing out Spike 0's two open real-device items.
