# Feature: Spike 0 — GPS de-risk

> Created: 2026-07-08
> Status: Phase 1 complete — Phase 2 requires a real Android device
> Milestone: M0 - Spike 0: GPS de-risk

## Goal

Prove background GPS tracking works acceptably on a real Android device before writing any
product code.

## Requirements

- [x] EAS dev build with expo-location + expo-task-manager (build config + code ready; build
      itself is Phase 2)
- [x] Background tracking with Android foreground service notification — 39.4 min walk,
      485 points, continuous, screen locked/stopped multiple times without dropping tracking
- [x] Record a real 30+ min outdoor ride; log raw points — 2026-07-10 walk, see analysis below
- [x] Measure battery drain per hour — ~1.5% over 39.4 min = ~2.3%/hour, well under the
      <8-10%/hour target
- [ ] Test app-killed / screen-off / phone-locked scenarios — screen-lock survival looks good
      from the walk (see below), but no deliberate force-kill-from-recent-apps test yet
- [ ] Evaluate accuracy: urban vs open road — have one route so far (residential/office area,
      accuracy 3-22m, median 4.6m); still need an open-road comparison
- [ ] Pick maps library by rendering the recorded track

(Issues #1-#7 in the `mohald-3/velolog-app` repo, milestone M0.)

## Roadmap

### Phase 1: Scaffold + tracking code — small (DONE)
- [x] Minimal Expo + TypeScript app at repo root (SDK 57, satisfies "54+")
- [x] Install expo-location, expo-task-manager, expo-dev-client, expo-file-system, expo-sharing
- [x] `tasks/locationTask.ts`: TaskManager background task, appends points to
      `spike-track.ndjson` on every callback (survives app kill — no in-memory-only state)
- [x] `App.tsx`: permission flow (foreground then background), Start/Stop tracking,
      live point count + log size, Share log file (via expo-sharing), Clear log
- [x] `app.json`: android package `com.mohald3.velolog`, location permissions, foreground
      service + background location plugin config, iOS Info.plist entries (for later)
- [x] `eas.json`: development/preview/production build profiles
- [x] EAS project created & linked: `@mohald-3/velolog-app`
      (id `7d4f16da-d37f-475c-a30f-40a5f9b2c541`)
- [x] typecheck / lint / test all green locally

### Phase 2: Real-device field test — medium (NEXT, manual)
- [x] `eas build --profile development --platform android` — build `9462890c-5fe9-43c5-8cb6-e5c445df7be9`,
      finished 2026-07-08, installed successfully (had to enable "install unknown apps" for the
      browser used to download it). **Superseded — see below.**
- [x] `eas build --profile preview --platform android` — build `da6449c5-92be-4af0-b861-cc1de928e9e3`
      finished 2026-07-08. Standalone (no Metro/PC needed). **Crashed immediately on "Start
      tracking"** — `adb logcat` showed `IllegalArgumentException: Requested job cannot be
      persisted without holding android.permission.RECEIVE_BOOT_COMPLETED permission` from
      expo-location's `LocationTaskConsumer.reportLocationsImmediately` (it schedules a
      persisted JobScheduler job). **Superseded — see below.**
- [x] Fixed: added `RECEIVE_BOOT_COMPLETED` to `app.json` android permissions (commit `1fcb3c8`).
- [x] Rebuilt `preview` — build `134fc1d4-131c-4c47-bb30-2444ecc5b726` finished 2026-07-10.
      Install: https://expo.dev/accounts/mohald-3/projects/velolog-app/builds/134fc1d4-131c-4c47-bb30-2444ecc5b726
      **This is the current one to field-test with.**
- [x] Grant foreground location, then background ("Allow all the time")
- [x] Start tracking, walk 30+ min outdoors (39.4 min, 2026-07-10) — first successful field test
- [x] Note battery % before/after, compute %/hour — ~1.5%/39.4min = ~2.3%/hour
- [ ] Mid-ride: explicitly force-kill the app from recent apps, confirm the task keeps logging /
      log survives on reopen (walk showed screen-lock survival via two 30-50s stopped-still gaps,
      but that's not the same as a deliberate kill test)
- [ ] Try one urban ride and one open-road ride, compare accuracy visually — have one data point
      so far, need a contrasting route
- [x] Pulled `spike-track.ndjson` via "Share log file" and analyzed it (see Session Log below) —
      still want to actually render it on a map, not just stats, before picking MapLibre vs
      react-native-maps

**Walk analysis (2026-07-10, 18:26-19:05):** 485 points, 39.4 min, zero out-of-order timestamps,
zero implausible jumps (>90 km/h), accuracy 3-22m (median 4.6m), speed avg 4.5 / max 5.8 km/h
(consistent with walking pace), raw haversine distance 2.61 km. Two gaps >30s (39s, 52s) that
line up with the user recalling stopping a couple of times — consistent with the 5m
`distanceInterval` throttling rather than tracking dying. Point cadence (median 4.1s) matches
expectation: at ~4.5 km/h, 5m takes ~4s, so the distance throttle — not the 2s time interval —
is what's actually gating updates at walking speed. Battery: ~1.5% used over 39.4 min = ~2.3%/hour
— comfortably under the <8-10%/hour exit-criteria target, with margin even if a real ride (faster
movement, more frequent fixes) draws somewhat more.

## Current Position

```
Phase: 2 of 2
Task:  5 of 6 (build, permissions, walk, and battery done; kill-test + urban/open-road remain)
Status: 4/7 GitHub issues closed — narrower gaps remain (manual)
```

## Progress

[█████████████████░░░] ~5/6 of Phase 2 complete

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-08 | Scaffold at repo root now, not a throwaway branch | M1's "project scaffold" issue extends this in place (adds Drizzle/expo-sqlite, repository layer, feature folders) instead of redoing Expo init |
| 2026-07-08 | Android package: `com.mohald3.velolog` | User's choice, based on GitHub handle |
| 2026-07-08 | Location accuracy `High`, 2s/5m interval for the spike | Matches realistic ride-tracking settings rather than max-power `BestForNavigation`, since the point is to test the settings the real app would ship with |
| 2026-07-08 | Points persisted to an NDJSON file on every task callback, not kept in memory | Directly needed for the "app-killed" test — an in-memory array would be lost across a headless relaunch |
| 2026-07-08 | Use the `preview` build profile (standalone) for field testing, not `development` | `development` builds need a live Metro connection; an outdoor ride has no Wi-Fi back to the PC, and the whole point of Phase 2 is testing app-killed/no-connectivity survival |
| 2026-07-10 | Added `RECEIVE_BOOT_COMPLETED` permission | Real-device crash on Start tracking, root-caused via `adb logcat`: expo-location's background task consumer needs it to schedule a persisted JobScheduler job |

## Session Log

| Date | Session | What happened |
|------|---------|---------------|
| 2026-07-08 | Planning + Phase 1 | Scaffolded Expo TS app, background location task, spike UI, eas.json, linked EAS project. All local checks green. Phase 2 (field test) handed off — needs the user's phone. |
| 2026-07-08 | Phase 2 build | Ran `eas build --profile development --platform android --non-interactive`. Cloud-generated Android keystore (no local keytool), build finished in ~7 min. APK ready to install; remaining Phase 2 steps (permissions, real ride, battery, kill-test, urban/open-road, map pick) are manual. |
| 2026-07-08 | Install + rebuild | User installed the dev build after enabling "install unknown apps" for their browser. Realized dev-client needs a live Metro connection, wrong fit for an outdoor field test — built `preview` profile instead (standalone APK, no PC needed). Remaining Phase 2 steps still manual. |
| 2026-07-10 | Crash + fix | Preview build crashed on Start tracking. Connected phone via `adb`, captured `logcat`, root-caused to a missing `RECEIVE_BOOT_COMPLETED` permission (expo-location schedules a persisted JobScheduler job). Fixed in `app.json`, rebuilt `preview` — build `134fc1d4-131c-4c47-bb30-2444ecc5b726`. Waiting on user to reinstall and retry. |
| 2026-07-10 | First successful field test | User walked 39.4 min with the fixed preview build. 485 points logged, no crashes, no out-of-order timestamps, no implausible jumps, accuracy median 4.6m, speed consistent with walking pace. Two 30-50s gaps matched the user stopping (not a tracking failure) — consistent with the 5m distanceInterval throttle. Battery %, an explicit force-kill test, and an open-road (vs. this residential/office route) comparison are still open before Spike 0's exit criteria are fully met. |
| 2026-07-10 | Battery result + board update | User reported ~1.5% battery used over the 39.4 min walk (~2.3%/hour, well under the <8-10%/hour target). Closed GitHub issues #1, #2, #3, #4 with evidence in the comments; added progress comments to #5, #6, #7 (still open — kill-test, open-road route, map render). Milestone M0 now 4/7 closed. |
