# Feature: UX/UI Pass (post-v0.2 polish)

> Created: 2026-07-13
> Status: Planned — ready to execute Phase 1
> Milestone: unplanned (post-v0.2 polish, before M6) — D-items tracked in issue #43

## Goal

Close out #43's D-items and bring every screen up to the app's own UX conventions (header
actions, honest formatting, useful wear display) before starting M6.

## Requirements

- [ ] D1: `formatDuration` shows hours (a 2h ride must not read "120:00")
- [ ] D4: `LocaleSync` changes language in an effect, not during render
- [ ] D6: all three Add/Edit form screens set a `Stack.Screen` title (they currently show the
      raw route path, e.g. `bikes/[id]/components/[compon…`)
- [ ] D7: form inputs seeded from `metersToDistanceUnit` are rounded for display (shared
      helper in `units.ts`), not `0.22011187862751427`
- [ ] D3: BikeDetail page actions (Edit, Archive) move to header icons + "⋮" overflow dropdown
      per the header-actions convention; overflow menu extracted as a shared primitive
- [ ] D2: `expectedLifetimeKm` migrated to meters (`expectedLifetimeM`) for unit consistency,
      and wear vs. lifetime actually displayed (progress on component rows) — the field is
      currently collected but never shown
- [ ] Visual sweep: light + dark emulator pass over all screens, inconsistencies fixed
- [x] D5: display-unit variable naming in AddEditRuleScreen — already fixed by the C1
      primitives conversion (renamed to `intervalDisplay`/`lastPerformedDisplay`)

## Roadmap

### Phase 1: Quick D-item fixes — small
- [ ] D1: add hours segment to `formatDuration` (`src/features/rides/format.ts`) + tests
- [ ] D4: move `LocaleSync`'s `i18n.changeLanguage` into a `useEffect` (`src/app/_layout.tsx`)
- [ ] D6: `Stack.Screen` titles on AddEditBikeScreen, AddEditComponentScreen,
      AddEditRuleScreen (add/edit variants, translated, en+sv)
- [ ] D7: display-rounding helper in `src/domain/units.ts` (+ tests); use it wherever form
      state is seeded from `metersToDistanceUnit`

### Phase 2: Header actions + overflow menu — medium
- [ ] Extract `OverflowMenu` into `src/components/` from RideDetailScreen's inline Modal menu
- [ ] BikeDetail (D3): Edit → header icon, Archive → "⋮" overflow; drop the bottom
      Edit/Archive buttons; Start Ride stays as the primary CTA, View Rides/Statistics stay
      as navigation
- [ ] AddEditComponentScreen: move Replace/Retire behind "⋮" overflow (destructive actions),
      keep Rules/Log as navigation buttons
- [ ] Live-verify menus on emulator (anchored dropdown, not a shortcut to the action)

### Phase 3: Component wear visibility — medium
- [ ] D2: schema migration `expected_lifetime_km` → `expected_lifetime_m` (integer meters),
      domain type + repositories + form conversion updated
- [ ] `computeWearPercent` (or similar) in `src/domain/wear.ts` + unit tests
- [ ] BikeDetail component rows show wear progress vs. expected lifetime when set
      (bar or percentage; color shifts via existing OK/DueSoon/Overdue palette)
- [ ] Live-verify with a component that has a lifetime set

### Phase 4: Visual sweep + live verification — small/medium
- [ ] Emulator pass over every screen in light AND dark mode; screenshot record
- [ ] Fix spacing/empty-state inconsistencies found
- [ ] Full verify: typecheck, lint, tests, i18n parity

## Current Position

```
Phase: 1 of 4
Task:  0 of 4
Status: Ready to execute
```

## Progress

[░░░░░░░░░░░░░░░░░░░░] 0/4 phases

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-13 | D-items grouped into a UX pass rather than fixed piecemeal | They're all presentation-layer; one pass with a final visual sweep beats seven micro-PRs |
| 2026-07-13 | D2 includes *showing* wear vs. lifetime, not just the unit migration | Migrating a field nobody sees would be churn; the progress display is what makes it worth it |
| 2026-07-13 | OverflowMenu becomes a shared primitive in Phase 2 | Rule of three: RideDetail has one, BikeDetail (D3) and the component form need one |

## Session Log

| Date | Session | What happened |
|------|---------|---------------|
| 2026-07-13 | Planning | Created plan with 4 phases after the v0.2 quality pass (#44/#46/#47) merged. D5 found already fixed by the C1 conversion; D6 found to affect all 3 form screens, not just one. |
