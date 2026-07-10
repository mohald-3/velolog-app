# Current Work

## Spike 0 — GPS de-risk (M0)

**Phase 1 (done, 2026-07-08):** Minimal Expo TS app scaffolded at repo root — expo-location,
expo-task-manager, expo-dev-client, expo-file-system, expo-sharing installed. Background
location task (`tasks/locationTask.ts`) logs points to an NDJSON file on disk (survives app
kill), foreground service notification configured for Android. `App.tsx` has a bare
Start/Stop/Share-log UI. `eas.json` added, EAS project linked
(`@mohald-3/velolog-app`, id `7d4f16da-d37f-475c-a30f-40a5f9b2c541`). Typecheck/lint/test all
pass locally (see `.claude/commands/verify.md`).

**Phase 2 (in progress, manual — needs your phone):**
- [x] `development` build installed — needs a live Metro connection, wrong fit for an outdoor
  ride. Superseded.
- [x] First `preview` build installed — **crashed on Start tracking**. Root-caused via
  `adb logcat` (phone connected via USB) to a missing `RECEIVE_BOOT_COMPLETED` permission
  (expo-location schedules a persisted JobScheduler job for the background task). Fixed in
  `app.json`, commit `1fcb3c8`.
- [x] Rebuilt `preview` with the fix, finished 2026-07-10:
  https://expo.dev/accounts/mohald-3/projects/velolog-app/builds/134fc1d4-131c-4c47-bb30-2444ecc5b726
- [x] **First successful field test, 2026-07-10:** 39.4 min walk, 485 points, no crashes, no
  out-of-order timestamps, no implausible jumps, accuracy median 4.6m, speed consistent with
  walking pace. Two 30-50s gaps matched the user stopping — looks like normal distanceInterval
  throttling, not a tracking failure. Log analyzed in `Temp_log_files/spike-track.ndjson`
  (gitignored/local, not committed).

- [x] **Battery result:** ~1.5% used over the 39.4 min walk = ~2.3%/hour — well under the
  <8-10%/hour exit-criteria target.

**Board updated:** milestone M0 is now 4/7 closed (#1 EAS build, #2 background tracking,
#3 30+ min recording, #4 battery). Comments added to the remaining 3 with current progress.

**Still open before Spike 0's exit criteria are met:**
- **#5** A deliberate force-kill-from-recent-apps test (the walk only showed screen-lock/stopped
  survival, not an explicit kill)
- **#6** An open-road route to compare against this residential/office-area one
- **#7** Actually rendering the track on a map (only did stats analysis so far) to help pick
  MapLibre vs react-native-maps

See `.planning/STATE.md` for the full phase breakdown.

---
_Last updated: 2026-07-10 (battery result in, 4/7 M0 issues closed; kill-test/open-road/map-render still open)._
