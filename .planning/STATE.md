# Feature: M4 — Maintenance (v0.2)

> Created: 2026-07-11
> Status: Phase 2 complete — ready to execute Phase 3
> Milestone: M4 - Maintenance (v0.2) — GitHub milestone, issues #29-#34

## Goal

Mileage-driven maintenance reminders: configure a rule per component (e.g. "lube chain every
200 km"), get notified when it's due, mark it done, and see the history — closing the milestone
exit criteria's full loop (ride past threshold → notification fires → mark done → status resets).

## Requirements

- [x] `MaintenanceRule` domain type + pure due-status function (`OK` / `DueSoon` / `Overdue`),
      derived from the bike's odometer — never a stored counter, mirroring `wear.ts`'s pattern (#30)
- [x] `MaintenanceRule` CRUD with sensible presets: chain lube 200 km, chain replace 3,000 km,
      brake pad check 1,000 km (#29)
- [x] Due-status recomputed after every completed ride, and on ride delete — this is where #28's
      previously no-op "rule-status recomputation" stub gets real logic to call
- [x] Local notification via `expo-notifications` when a rule crosses into `DueSoon`/`Overdue` (#31)
- [x] `MaintenanceRecord` entity + "mark as done" flow: creates a record, resets the rule's
      `lastPerformedAtOdometerM` (#32)
- [ ] Maintenance log view per component: history + cost (#33)
- [ ] Component replacement flow: retire old component, install new one at current odometer (#34)

**Baked-in defaults** (documented as Decisions below, adjustable later):
- `DueSoon` when remaining distance ≤ 10% of `intervalKm` (min 20 km floor so short intervals
  like chain lube don't get a meaninglessly tiny window)
- Notification check happens right after a ride is saved or deleted — the only point the
  odometer actually changes in a local-first app with no background cron

## Roadmap

### Phase 1: MaintenanceRule domain + due-status + CRUD — medium/large — DONE
- [x] `src/domain/maintenance.ts`: `MaintenanceRule`/`DueStatus` types, `computeDueInfo` +
      `worstDueStatus` pure functions (dueInM derivation + OK/DueSoon/Overdue thresholds), 12
      unit tests
- [x] `maintenance_rules` table + migration; `maintenanceRuleRepository` (listByComponent/
      getById/create/update/archive, mirroring `bikeRepository`/`rideRepository` conventions)
- [x] `features/maintenance/` feature folder: `MaintenanceRulesScreen` (list per component, with
      a color-coded status badge per rule), `AddEditRuleScreen` with the three presets as
      quick-fill chips plus a custom option
- [x] Due-status recompute needed **no new wiring** — it's fully derived from whatever odometer
      value is passed to `computeDueInfo` at render time, so ride save/delete (which already
      recompute the bike's odometer) automatically keep it correct. This closes #28's stub with
      zero new domain code, same pattern as M3's odometer recompute.
- [x] Due-status dot on `BikeDetailScreen`'s component rows (`worstDueStatus` across a
      component's rules), suppressed when status is OK to avoid visual noise

### Phase 2: Notifications + mark as done — medium — DONE
- [x] `expo-notifications` install + config plugin + native rebuild (`npx expo run:android`,
      required since this module has native code, unlike Phase 1's pure-JS `@expo/vector-icons`)
- [x] `shouldNotifyOnStatusChange` pure domain helper: fires only on an upward status crossing
      (OK→DueSoon, DueSoon→Overdue), never on an unchanged or improving status — 5 unit tests
- [x] `src/services/notifications.ts`: permission handling + `checkMaintenanceNotifications`,
      wired into ride save/delete via `useRides.ts`'s `notifyOnOdometerChange` (compares the
      bike's odometer before/after the change for every rule on every component)
- [x] `maintenance_records` table + migration; `maintenanceRecordRepository`
- [x] "Mark as done" action on the rule edit screen: creates a `MaintenanceRecord`, resets
      `lastPerformedAtOdometerM` to the bike's current odometer, confirm dialog shows the exact
      value it'll log at

### Phase 3: Maintenance log + component replacement — small/medium
- [ ] Maintenance log screen per component: list of `MaintenanceRecord`s (date, odometer, cost,
      notes), reachable from the component's row/detail
- [ ] Component replacement flow: retire old component (`isRetired = true`), create a new
      component of the same type at the bike's current odometer as its `installedAtOdometerM`
      (fresh wear baseline) — decide during execution whether existing `MaintenanceRule`s move to
      the new component or need to be recreated

## Current Position

```
Phase: 3 of 3
Task:  0
Status: Ready to execute Phase 3
```

## Progress

[██████████████░░░░░░] 2/3 phases

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-11 | `DueSoon` threshold = remaining distance ≤ 10% of `intervalKm`, floor 20 km | Simple, proportional rule that still gives a meaningful heads-up window on short intervals (e.g. 200 km chain lube → 20 km floor rather than a 20 km 10%-derived window that would be fine here, but a very short custom interval could otherwise round to near-zero) |
| 2026-07-11 | Notification/due-status recompute triggers only on ride save/delete | Local-first app, no background job infrastructure; odometer only changes at those two points, so that's the only point status can meaningfully change |

## Session Log

| Date | Session | What happened |
|------|---------|---------------|
| 2026-07-11 | Planning | Created plan with 3 phases; requirements and two default judgment calls confirmed with user before roadmap was written |
| 2026-07-11 | Phase 1 | Built `computeDueInfo`/`worstDueStatus` domain functions (12 unit tests), `maintenanceRuleRepository`, and the maintenance feature folder (rule list with badges, add/edit with presets). Verified live on emulator: created a "Lubricate chain" rule via the preset chip, confirmed correct "Due in 200 km · OK" math, confirmed the BikeDetailScreen status dot is correctly suppressed for OK status. Typecheck/lint/tests (61 total) all clean; committed on `feat/m4-maintenance` |
| 2026-07-12 | Phase 2 | Installed `expo-notifications`, required a native rebuild (`npx expo run:android`, ~1m17s) since it's the first native (non-pure-JS) module added this session — fixed a missing `JAVA_HOME` by pointing at Android Studio's bundled JBR. Built `shouldNotifyOnStatusChange` (5 unit tests), the notifications service, `maintenanceRecordRepository`, and the mark-as-done flow. **Fully verified live end-to-end**: recorded a real short ride via mocked GPS (`adb emu geo fix`, ~120m) against a rule tuned so this exact ride would cross OK→DueSoon; confirmed the real Android notification fired ("Maintenance due soon — Lubricate chain is due soon."), confirmed the orange DueSoon dot appeared on `BikeDetailScreen`, then used Mark as done and confirmed the rule reset to OK, a `MaintenanceRecord` was persisted correctly (verified via direct DB query), and no duplicate notification fired. Typecheck/lint/tests (66 total) all clean; committed on `feat/m4-maintenance` |
