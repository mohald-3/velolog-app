# Feature Complete: M5 — Polish & "Your Journey" (v0.2)

> Completed: 2026-07-12
> Duration: 1 session
> Phases: 4 planned, 4 executed

## What Was Built

The polish milestone: units (km/mi) + Swedish/English i18n across every screen, a garage-wide
Journey stats screen (distance, cost, CO₂ saved, calories, and a real-world distance milestone
checklist), an onboarding screen for an empty garage, dark mode with a system/light/dark toggle,
and a real app icon + splash screen replacing Expo's default placeholder art.

## Changes

- `src/domain/units.ts` + tests — distance (km/mi) and speed (km/h/mph) conversion, both
  directions — 16 unit tests
- `src/domain/journey.ts` + tests — garage-wide stats aggregation (total distance/rides/cost,
  CO2 saved vs car, calorie estimate) and milestone-progress checklist — 9 unit tests
- `AppSettings` singleton repository (`unitSystem`, `locale`, `themeMode`) + 2 migrations
- i18next + react-i18next + expo-localization; full English/Swedish resources in `src/i18n/`
- `src/theme/` — `ThemeColors` token palette (light/dark) + `useTheme()` hook
- `src/features/settings/`, `src/features/journey/`, `src/features/onboarding/` — new feature
  folders
- All 14 feature screens converted to `t()` translations, `formatDistance`/`formatSpeed`, and
  theme-driven `createStyles(colors)` — most delegated to parallel background agents once the
  pattern was established on 2-3 reference screens per phase
- `maintenanceRecordRepository.listAll()` for cross-cutting cost aggregation
- Real app icon, Android adaptive icon layers (foreground/background/monochrome), and a splash
  screen (the app had none configured before) — a "VL" wheel-monogram + map-pin + road mark,
  adapted from a user-provided reference logo into the app's existing brand green
- `expo-splash-screen`, `expo-system-ui` installed; `app.json` updated (`userInterfaceStyle:
  automatic`, adaptive icon background, splash config)
- Issues: #35, #36, #37, #38
- PR: https://github.com/mohald-3/velolog-app/pull/42

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| i18n via i18next + react-i18next + expo-localization, not a custom dictionary | User's explicit choice over a lighter custom approach |
| `AppSettings` is a singleton SQLite row via a repository, not AsyncStorage | Consistent with the repository-pattern rule; same seam cloud sync (Phase S) will plug into later |
| Journey stats include archived bikes' rides/cost in the totals | A bike being retired doesn't erase how far it carried you — "your journey" is lifetime, not just the current garage |
| Multi-currency isn't handled — costs are summed naively regardless of `currency` field | The app has no currency conversion anywhere yet; adding it here would be scope creep |
| CO2 (251 g/km) and calorie (35 kcal/km) factors are single hardcoded constants | No rider weight/power data exists to do better; documented as an approximation in `journey.ts` |
| Onboarding has no persisted "seen it" flag — renders whenever the garage is empty | An empty garage always warrants the same welcome + CTA, whether first launch or all bikes archived |
| Theme lives in `src/theme/`, not `src/domain/` | Colors are a presentation concern, same reasoning as `src/i18n/` living outside domain |
| Static `StyleSheet.create` converted to a `createStyles(colors)` factory via `useMemo`, not inline style overrides | Keeps the diff structurally close to the original while staying reactive to theme changes |
| Icon adapted from the user's ChatGPT-generated reference into the existing app green (not the reference's own navy/teal) | User chose "keep the icon consistent with the app" over introducing a new two-tone brand that would require re-theming every button/link |
| Icon assets built as one master SVG rendered via `sharp`, not hand-exported bitmaps | Only a vector source guarantees crispness from 48px favicon to 1024px icon; reproducible if the design needs tweaking later |

## Deviations From Plan

- Icon/splash work was explicitly split into two passes at the user's request: theme
  infrastructure first (Phase 4, initial pass), with the actual icon/splash art held pending the
  user's direction — then a follow-up session once they had a reference image to adapt.
- Presented 5 original icon concepts as an HTML comparison artifact; the user instead brought a
  ChatGPT-generated reference logo they liked better, so a second artifact adapted that concept
  into 3 palette options instead of using the original 5.
- Hit a one-off `DevLauncherErrorActivity` blip (dev client briefly failed to reconnect to Metro
  right after a native rebuild) that looked like a real regression but wasn't — confirmed via
  logcat and a fresh screenshot that the app was rendering correctly.
- Otherwise executed as planned across all 4 phases.

## Verification

- Full typecheck/lint/91 unit tests passed after every phase.
- Verified live on an Android emulator (Pixel 8): units toggle, language toggle, journey
  milestones, onboarding flow, dark/light mode switching across Settings/BikeList/BikeDetail/
  Journey screens (no regressions in light mode), new launcher icon, and new splash screen —
  all confirmed working via screenshots.

## What's Next

- M6 — v0.3 candidates (pick 2–3, not all): GPX export/import, distance charts, elevation gain,
  weather snapshot on ride save (first optional network dependency), ride photos.
- Spike 0's two still-open real-device items (#5 deliberate kill test, #6 urban-vs-open-road
  accuracy) remain separate — they need an actual outdoor ride, not an emulator.
