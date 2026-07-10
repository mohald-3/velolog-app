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
  — **install this one (replaces the crashing one) and retry Start tracking.**
- Run through issues #1–#7 (milestone M0): grant foreground + "Allow all the time" background
  location, start tracking, lock the phone, ride 30+ min, check battery drain, kill the app
  mid-ride and confirm the log survives, compare urban vs. open-road accuracy
- Use "Share log file" in-app to pull `spike-track.ndjson` off the device for analysis
- Report back: battery %/hour, whether tracking survived app-kill/screen-off, and how the
  track looks plotted on a map — that's Spike 0's exit criteria

See `.planning/STATE.md` for the full phase breakdown.

---
_Last updated: 2026-07-10 (crash fixed and rebuilt; waiting on user to retry field test)._
