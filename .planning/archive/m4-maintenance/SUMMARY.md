# Feature Complete: M4 — Maintenance (v0.2)

> Completed: 2026-07-12
> Duration: 1 session (spanning 2026-07-11 to 2026-07-12)
> Phases: 3 planned, 3 executed

## What Was Built

The differentiator milestone: mileage-driven maintenance reminders. Configure a rule per
component (with sensible presets — chain lube 200 km, chain replace 3,000 km, brake pad check
1,000 km), get a real local notification when a rule crosses into DueSoon/Overdue, mark it done
(logging a record and resetting the counter), see the full service history per component, and
replace a worn component with a fresh one. Closes the milestone's full loop: ride past threshold
→ notification fires → mark done → status resets.

## Changes

- `src/domain/maintenance.ts` + tests — `computeDueInfo` (OK/DueSoon/Overdue derivation, never a
  stored counter), `worstDueStatus` (badge summary across a component's rules),
  `shouldNotifyOnStatusChange` (fires only on an upward crossing) — 17 unit tests
- `maintenance_rules` + `maintenance_records` tables/migrations; `maintenanceRuleRepository`,
  `maintenanceRecordRepository`
- `src/features/maintenance/` — `MaintenanceRulesScreen` (list with color-coded badges),
  `AddEditRuleScreen` (presets + Mark as done), `MaintenanceLogScreen` (per-component history)
- `src/services/notifications.ts` — permission handling + `checkMaintenanceNotifications`, wired
  into ride save/delete via `useRides.ts`'s `notifyOnOdometerChange`
- `useReplaceComponent` in `useComponents.ts` — retires the old component, installs a fresh one
  at the current odometer, migrates active rules with their counter reset
- Fixed a latent bug: `AddEditComponentScreen` used `bike.startingOdometerM` instead of the
  ride-derived current odometer (a leftover from before M2 added ride tracking)
- Issues: #29, #30, #31, #32, #33, #34
- PR: https://github.com/mohald-3/velolog-app/pull/41

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| `DueSoon` threshold = remaining distance ≤ 10% of interval, floored at 20 km | Simple, proportional rule that still gives a meaningful heads-up window on short intervals (a 200 km chain lube interval lands exactly on the 20 km floor) |
| Due-status/notification recompute triggers only on ride save/delete | Local-first app, no background job infrastructure; the odometer only changes at those two points |
| Notifications fire only on an *upward* status crossing (OK→DueSoon, DueSoon→Overdue) | Prevents spamming a notification on every ride once a rule is already DueSoon/Overdue; mark-as-done resets status without ever triggering a notification since it doesn't go through the odometer-change check path |
| Component replacement migrates active rules to the new component with their counter reset | A replaced part's own service history doesn't apply to the new one — the new component starts fresh, same as its wear baseline |
| #28's "rule-status recomputation on ride delete" needed zero new domain code | Due-status is fully derived from whatever odometer value is passed to `computeDueInfo` at render time — automatically correct wherever displayed, identical pattern to M3's odometer recompute |

## Deviations From Plan

- Found and fixed a pre-existing bug in `AddEditComponentScreen` (using the bike's starting
  odometer baseline instead of the actual current odometer) — not in the original plan, but
  necessary for the component-replacement flow to compute a correct fresh baseline.
- `expo-notifications` required a native rebuild (`npx expo run:android`) since it has native
  code, unlike `@expo/vector-icons` added during M3 (pure JS). Needed to fix a missing
  `JAVA_HOME` by pointing at Android Studio's bundled JBR.
- Hit a severe emulator slowdown during Phase 3 live verification (every `adb` command taking
  minutes; a bundle-download protocol error persisted even after fully restarting Metro).
  Resolved by killing and restarting the Pixel_8 AVD entirely — all app data was intact
  afterward since SQLite persists on the emulator's disk, independent of the emulator process.
- Otherwise executed as planned across all 3 phases.

## Verification

All three phases were verified live on the Android emulator against real data, not just unit
tests:
- **Phase 1**: created a "Lubricate chain" rule via the preset chip; confirmed correct
  "Due in 200 km · OK" math; confirmed the due-status dot is correctly suppressed for OK status
- **Phase 2** (the milestone's signature exit criteria): recorded a real short ride via mocked
  GPS (`adb emu geo fix`) against a rule tuned so that exact ride would cross OK→DueSoon;
  confirmed the actual Android notification fired ("Maintenance due soon — Lubricate chain is
  due soon."); confirmed the DueSoon badge appeared; used Mark as done and confirmed the rule
  reset to OK, a `MaintenanceRecord` persisted correctly (verified via direct DB query), and no
  duplicate notification fired
- **Phase 3**: confirmed the maintenance log screen correctly showed the mark-as-done record;
  replaced the Chain component and confirmed via direct DB query that the old component was
  retired, the new one was created at the correct odometer, and the rule migrated with its
  counter reset

## What's Next

- M5 — Polish & "Your Journey" (v0.2): journey stats screen (real-world distance equivalence,
  cost per km, CO₂ saved vs car, calories estimate), onboarding for first bike, units setting
  (km/mi) + Swedish/English i18n, app icon/splash/dark mode pass.
- Spike 0's two still-open real-device items (#5 deliberate kill test, #6 urban-vs-open-road
  accuracy) remain separate — they need an actual outdoor ride, not an emulator.
