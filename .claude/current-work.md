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
- [x] `development` build installed (had to enable "install unknown apps" for the browser) —
  then realized it needs a live Metro connection, wrong fit for an outdoor ride. Superseded.
- [x] `preview` build (standalone, no PC needed) finished 2026-07-08:
  https://expo.dev/accounts/mohald-3/projects/velolog-app/builds/da6449c5-92be-4af0-b861-cc1de928e9e3
  — **install this one and use it for the actual field test.**
- Run through issues #1–#7 (milestone M0): grant foreground + "Allow all the time" background
  location, start tracking, lock the phone, ride 30+ min, check battery drain, kill the app
  mid-ride and confirm the log survives, compare urban vs. open-road accuracy
- Use "Share log file" in-app to pull `spike-track.ndjson` off the device for analysis
- Report back: battery %/hour, whether tracking survived app-kill/screen-off, and how the
  track looks plotted on a map — that's Spike 0's exit criteria

See `.planning/STATE.md` for the full phase breakdown.

---
_Last updated: 2026-07-08 (preview build finished; waiting on manual field test)._
