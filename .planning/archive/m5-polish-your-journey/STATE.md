# Feature: M5 — Polish & "Your Journey" (v0.2)

> Created: 2026-07-12
> Status: All 4 phases complete — ready for final /verify and milestone close-out
> Milestone: M5 (v0.2) — GitHub milestone #6

## Goal

Round out the app into something demo-ready: journey-level stats, first-run onboarding, units/language settings, and a real visual polish pass — "would not be embarrassed to show a recruiter or put on Google Play internal testing."

## Requirements

- [x] Units (km/mi) + Swedish/English i18n infrastructure (issue #37)
- [x] Journey stats screen: real-world distance equivalence, cost per km, CO2 saved vs car, calories estimate (issue #35)
- [x] Onboarding for first bike (issue #36)
- [x] App icon, splash, dark mode pass (issue #38)

## Roadmap

### Phase 1: Units & i18n infrastructure — large — COMPLETE (2026-07-12)
- [x] `AppSettings` domain type + repository (unit system: metric/imperial, locale: en/sv), new Drizzle migration for the settings table
- [x] Pure unit-conversion helpers in `src/domain/units.ts` (distance km/mi + speed km/h/mph, both directions) with unit tests
- [x] Install i18next + react-i18next + expo-localization; en/sv translation resources covering existing UI strings
- [x] New Settings screen (`src/features/settings/`) to toggle units + language, persisted via the repository, linked from a gear icon in the home screen header
- [x] Wire all 11 existing screens (bikes, rides, maintenance) to use unit formatting + `t()` instead of hardcoded km/English strings

### Phase 2: Journey stats screen — medium — COMPLETE (2026-07-12)
- [x] New `src/domain/journey.ts`: total distance/rides, cost (purchase + maintenance), CO2 saved vs car, calories estimate, and a "Stockholm → Copenhagen ✓" style milestone checklist — pure functions, unit tested
- [x] Hook (`useJourneyStats`) aggregating all bikes (including archived) + all rides + all maintenance records across the garage
- [x] New Journey stats screen, wired into navigation via a header icon on the home screen (next to Settings)

### Phase 3: Onboarding for first bike — small/medium — COMPLETE (2026-07-12)
- [x] Detect zero-bikes state on app launch (already the home screen's first query — no new detection needed)
- [x] Onboarding flow (`src/features/onboarding/`: welcome title, tagline, 3-line pitch) funneling into `AddEditBikeScreen` via a "Add your first bike" CTA

### Phase 4: App icon, splash, dark mode pass — medium — COMPLETE (2026-07-12)
- [x] `userInterfaceStyle: "automatic"` + light/dark palette layer (`src/theme/`) across all 14 feature screens, replacing hardcoded colors
- [x] Theme override (system/light/dark) added to the Settings screen from Phase 1
- [x] Icon/splash asset refresh — a "VL" wheel-monogram + map-pin + road mark (adapted from a reference the user liked), in the app's existing brand green; real production assets generated and wired up, plus a real splash screen (previously unconfigured)

## Current Position

```
Phase: 4 of 4
Task:  3 of 3
Status: All phases complete
```

## Progress

[████████████████████] 4/4 phases

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-12 | Phase order: i18n/units → journey stats → onboarding → icon/splash/dark mode | Journey stats screen should display in the user's chosen unit/locale from day one; icon/splash/dark mode touches every screen so it's easiest done last once everything else is stable |
| 2026-07-12 | i18n via i18next + react-i18next + expo-localization, not a custom dictionary | User's explicit choice over a lighter custom approach — standard library preferred despite only 2 languages |
| 2026-07-12 | `AppSettings` is a singleton SQLite row (id='singleton') via a repository, not AsyncStorage | Consistent with the repository-pattern architecture rule — UI never touches Drizzle directly, and this is the same seam cloud sync (Phase S) will plug into later |
| 2026-07-12 | Fields storing distances in domain-km (e.g. `Component.expectedLifetimeKm`, `MaintenanceRule.intervalM` presets) keep their stored unit as-is; only the displayed/edited value in forms converts via `distanceUnitToMeters`/`metersToDistanceUnit` | Avoids migrating stored data or changing domain semantics just because the display unit changed — the unit system is a presentation concern |
| 2026-07-12 | Journey stats include archived bikes' rides/cost in the totals | A bike being retired from active use doesn't erase how far it carried you — "your journey" is meant to be lifetime, not just the current garage |
| 2026-07-12 | Multi-currency isn't handled — `totalCost` sums every bike's `purchasePrice` and every `MaintenanceRecord.cost` regardless of `currency` field | The app has no currency conversion anywhere yet (existing screens already just show raw cost numbers); adding it here would be scope creep beyond what any other screen does |
| 2026-07-12 | CO2 (251 g/km, EPA average passenger vehicle) and calorie (35 kcal/km, moderate leisure cycling) factors are single hardcoded constants, not adjustable | No rider weight/power data exists to do better; documented as an approximation directly in `journey.ts` rather than over-engineering a settings knob for a v0.2 nice-to-have |
| 2026-07-12 | `useJourneyStats` uses its own `['journey', ...]` query keys instead of sharing keys with `useBikes`/`useRides` | It's a cross-cutting aggregate (all bikes/rides/records) that doesn't map to any single bike's invalidation; relies on TanStack Query's default `staleTime: 0` to refetch fresh every time the screen is focused, which is sufficient for a stats screen |
| 2026-07-12 | Onboarding has no persisted "seen it" flag — it just renders whenever the garage is empty (`bikes.length === 0`), replacing `BikeListScreen`'s old bare empty state | An empty garage always warrants the same welcome + CTA, whether it's a true first launch or a user who archived their only bike; adding a flag to distinguish those cases would be complexity with no behavioral upside |
| 2026-07-12 | Theme lives in `src/theme/` (semantic `ThemeColors` tokens + `useTheme()` resolving system/light/dark), not `src/domain/` | Colors are a presentation concern, not domain logic — same reasoning as `src/i18n/` living outside domain |
| 2026-07-12 | `themeMode` added to the same `AppSettings` singleton row/repository/Settings screen as units and locale, rather than a separate settings mechanism | One settings surface, one persistence seam — consistent with the Phase 1 decision to keep `AppSettings` a single repository-backed row |
| 2026-07-12 | Static `StyleSheet.create({...})` per screen converted to a `createStyles(colors)` factory called via `useMemo` inside the component, rather than inline style overrides | Keeps the diff structurally close to the original (same object shape, just colors parameterized) while still being fully reactive to theme changes; established as the pattern in `BikeListScreen`/`OnboardingScreen`/`SettingsScreen` before delegating the remaining 11 screens |
| 2026-07-12 | `src/app/dev/*.tsx` (GPS spike/track-map dev tooling) and the `_layout.tsx` migration-failure fallback screen were left with hardcoded colors, not themed | Dev screens were already excluded from i18n in Phase 1 for the same reason (internal tooling, not user-facing polish); the migration-error screen must not depend on `useSettings()`/theme, since if migrations are broken the settings table itself may not exist yet |
| 2026-07-12 | Icon/splash art: user provided a ChatGPT-generated reference logo (wheel + "VL" monogram + map pin + winding road, navy/teal); adapted it into flat vector shapes in the app's existing green (`#2f6f4f`/`#1f2a24` neutral) rather than the reference's own navy/teal palette | User chose "keep the icon consistent with the app" over adopting a new two-tone brand — avoids re-theming every button/link/status dot in the running app just for the icon |
| 2026-07-12 | Icon assets built as one master SVG glyph rendered via `sharp` (added as a devDependency) at each required size/padding, rather than hand-exporting bitmaps | Only a vector source guarantees crispness from 48px favicon to 1024px icon; also makes the design reproducible/tweakable later instead of being a one-off Photoshop export |
| 2026-07-12 | Android adaptive icon foreground/monochrome layers scale the glyph to ~66.5% of canvas width (not edge-to-edge) | Matches Android's documented adaptive-icon safe zone (66dp visible circle inside a 108dp canvas) so the mark doesn't get clipped by launchers that apply a circular/squircle mask |
| 2026-07-12 | Installed `expo-splash-screen` + `expo-system-ui` and wired a real splash config in `app.json` | The app had no splash screen configured at all before this — `splash-icon.png` existed but was an orphaned, unused default asset; `expo-system-ui` was additionally required for `userInterfaceStyle: "automatic"` (set in Phase 4) to actually take effect natively, not just in the JS theme layer |

## Session Log

| Date | Session | What happened |
|------|---------|----------------|
| 2026-07-12 | Planning | Created plan with 4 phases; confirmed with user (i18n library choice, phase order) |
| 2026-07-12 | Execute Phase 1 | Built `AppSettings` repo + migration, `src/domain/units.ts` (distance + speed conversion, both directions, unit tested), installed i18next/react-i18next/expo-localization with full en/sv resources, built the Settings screen, wired all 11 existing screens (bikes/rides/maintenance) for units + translations — 9 of 11 screens done via parallel background agents, 2 (BikeListScreen, BikeStatsScreen) done directly as the reference pattern. Fixed one gap the agents' instructions missed (untranslated "Bike not found." in AddEditRuleScreen). Full typecheck, lint, and 82 domain tests pass. |
| 2026-07-12 | Verify Phase 1 | Ran `/verify`: typecheck/lint/tests all pass, no secrets, domain purity and repository pattern intact. Verdict: ready for PR (deferred — continued to Phase 2 first). |
| 2026-07-12 | Execute Phase 2 | Built `src/domain/journey.ts` (total distance/rides/cost, CO2, calories, milestone checklist) with 9 unit tests; added `maintenanceRecordRepository.listAll()`; built `useJourneyStats` hook aggregating the whole garage; built the Journey stats screen with a milestone checklist UI, wired into the home screen header via a new stats-chart icon next to Settings. Full typecheck, lint, and 91 domain tests pass. |
| 2026-07-12 | Verify Phase 2 + create PR | Ran `/verify` (clean), then `/pr` — created branch `feat/m5-units-i18n-journey-stats`, committed Phases 1+2 together, opened PR #42 closing issues #37 and #35. Continued Phase 3 on the same branch (matches the M4 precedent of one PR per milestone with commits per phase). |
| 2026-07-12 | Execute Phase 3 | Built `src/features/onboarding/screens/OnboardingScreen.tsx` (welcome title, tagline, 3-line pitch, "Add your first bike" CTA) and swapped it in for `BikeListScreen`'s old plain empty-state markup; removed the now-dead `bikeList.emptyTitle`/`emptySubtitle`/`addBike` i18n keys and matching unused styles. No domain changes this phase. Typecheck, lint, and 91 tests all pass. |
| 2026-07-12 | Verify Phase 3 + update PR | Ran `/verify` (clean), then `/pr` — committed Phase 3 to the same branch/PR #42, updated the PR body to include onboarding and close issue #36 too. |
| 2026-07-12 | Execute Phase 4 (theme infra only, per explicit user instruction to hold the icon/splash asset swap) | Added `themeMode` to `AppSettings` (type/schema/migration/repository) + a theme toggle in the Settings screen; built `src/theme/colors.ts` (light/dark semantic token palettes) and `src/theme/useTheme.ts`; wired the root navigator (`_layout.tsx`) to theme the header/screen background/status bar; set `app.json`'s `userInterfaceStyle` to `automatic`. Converted all 14 feature screens from static `StyleSheet.create` to the `createStyles(colors)` pattern — 3 done directly (BikeListScreen, OnboardingScreen, SettingsScreen) as the reference, 11 via parallel background agents. Agents caught several gaps in my own delegation instructions (a mismapped hex in `MaintenanceRulesScreen`'s `notFound` style, several missing `TextInput` colors/`placeholderTextColor` beyond what I'd scoped to `<Text>` only) — fixed the one remaining inconsistency (`AddEditBikeScreen`, `RideDetailScreen` missing `placeholderTextColor`) myself after review. Full typecheck, lint, and 91 tests pass. Icon/splash asset refresh still held for user's art direction. |
| 2026-07-12 | Ran the app on an Android emulator (Pixel 8) and eyeballed dark mode | Rebuilt the native app (had to set `JAVA_HOME` to Android Studio's bundled JBR — not set in this shell by default) and confirmed via screenshots: Settings theme toggle switches correctly, bike list/bike detail/journey stats all theme correctly in dark mode, and light mode still renders correctly after the refactor (no regressions). |
| 2026-07-12 | Icon/splash direction — presented 5 original concepts (wheel/spokes, bicycle silhouette, gear, chevron, route pin) as an HTML comparison artifact; user instead brought a ChatGPT-generated reference logo they liked and asked for a functional adaptation | Built a second comparison artifact adapting the reference's wheel+"VL"+pin+road concept into 3 palette options; user picked Option 2 (existing app green, no re-theming). Generated production assets (`icon.png`, Android adaptive foreground/background/monochrome, `splash-icon.png`, `favicon.png`) from one master SVG via a one-off `sharp` script; installed `expo-splash-screen` + `expo-system-ui`; updated `app.json` (adaptive icon background color, splash config); ran `expo prebuild --clean` + rebuilt the native app; verified the new launcher icon and splash screen on the emulator via screenshots. Full typecheck, lint, and 91 tests still pass. M5 is now fully complete — all 4 requirements and all 4 phases done. |
| 2026-07-12 | Debug transient blank screen | User reported a blank screen after the icon/splash rebuild. Logcat showed a one-off `DevLauncherErrorActivity` entry (dev client briefly failed to reconnect to Metro right after the native rebuild) — confirmed Metro itself was healthy (served a valid 7.8MB bundle, no errors) and a fresh screenshot showed the app rendering normally (bike list, FAB, header icons all correct). Not a real regression. |
| 2026-07-12 | Verify Phase 4 + final PR push | Ran `/verify` (clean — 9 files changed, icon/splash assets + config only, no source changes), then `/pr` — committed and pushed to the same branch, updated PR #42's body to reflect the complete M5 milestone. PR now closes all 4 issues (#37, #35, #36, #38) on merge. |
