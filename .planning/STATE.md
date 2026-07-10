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
- [ ] Background tracking with Android foreground service notification
- [ ] Record a real 30+ min outdoor ride; log raw points
- [ ] Measure battery drain per hour
- [ ] Test app-killed / screen-off / phone-locked scenarios
- [ ] Evaluate accuracy: urban vs open road
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
      finished 2026-07-08. Install: https://expo.dev/accounts/mohald-3/projects/velolog-app/builds/da6449c5-92be-4af0-b861-cc1de928e9e3
      Standalone (no Metro/PC needed) — **this is the one to actually field-test with**, since the
      `development` build needs a live Metro connection and can't survive being killed with no
      Wi-Fi during an outdoor ride. Same package/signing, so installing it replaces the dev build.
- [ ] Grant foreground location, then background ("Allow all the time")
- [ ] Start tracking, lock the phone, ride 30+ min outdoors
- [ ] Note battery % before/after, compute %/hour
- [ ] Mid-ride: force-kill the app, confirm the task keeps logging / log survives on reopen
- [ ] Try one urban ride and one open-road ride, compare accuracy visually
- [ ] Pull `spike-track.ndjson` via "Share log file", plot it (any quick tool/script) to
      sanity-check the track and decide MapLibre vs react-native-maps

## Current Position

```
Phase: 2 of 2
Task:  1 of 6 (build done, install + field test remain)
Status: Waiting on real-device field test (manual)
```

## Progress

[██████████░░░░░░░░░░] Phase 1/2 complete

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-08 | Scaffold at repo root now, not a throwaway branch | M1's "project scaffold" issue extends this in place (adds Drizzle/expo-sqlite, repository layer, feature folders) instead of redoing Expo init |
| 2026-07-08 | Android package: `com.mohald3.velolog` | User's choice, based on GitHub handle |
| 2026-07-08 | Location accuracy `High`, 2s/5m interval for the spike | Matches realistic ride-tracking settings rather than max-power `BestForNavigation`, since the point is to test the settings the real app would ship with |
| 2026-07-08 | Points persisted to an NDJSON file on every task callback, not kept in memory | Directly needed for the "app-killed" test — an in-memory array would be lost across a headless relaunch |
| 2026-07-08 | Use the `preview` build profile (standalone) for field testing, not `development` | `development` builds need a live Metro connection; an outdoor ride has no Wi-Fi back to the PC, and the whole point of Phase 2 is testing app-killed/no-connectivity survival |

## Session Log

| Date | Session | What happened |
|------|---------|---------------|
| 2026-07-08 | Planning + Phase 1 | Scaffolded Expo TS app, background location task, spike UI, eas.json, linked EAS project. All local checks green. Phase 2 (field test) handed off — needs the user's phone. |
| 2026-07-08 | Phase 2 build | Ran `eas build --profile development --platform android --non-interactive`. Cloud-generated Android keystore (no local keytool), build finished in ~7 min. APK ready to install; remaining Phase 2 steps (permissions, real ride, battery, kill-test, urban/open-road, map pick) are manual. |
| 2026-07-08 | Install + rebuild | User installed the dev build after enabling "install unknown apps" for their browser. Realized dev-client needs a live Metro connection, wrong fit for an outdoor field test — built `preview` profile instead (standalone APK, no PC needed). Remaining Phase 2 steps still manual. |
