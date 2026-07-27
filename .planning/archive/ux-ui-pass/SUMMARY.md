# UX/UI Pass Summary

> Completed: 2026-07-27
> Source: issue #43 D-items

## Delivered

- Durations now show hours when needed.
- Locale synchronization runs as an effect.
- Add/Edit bike, component, and maintenance-rule routes have translated titles.
- Converted distance values are rounded for editable form display.
- A shared anchored `OverflowMenu` now serves Ride Detail, Bike Detail, and Edit Component.
- Bike Edit is a header action; Bike Archive and Component Replace/Retire are overflow actions.
- Component expected lifetime uses metres throughout the domain, repository, and form layers.
- Existing kilometre lifetime values migrate to metres without data loss.
- Bike Detail shows component lifetime consumption as a percentage and color-coded progress bar.

## Migration note

Expo SQLite crashed natively when schema addition and data conversion shared one custom migration.
The safe implementation uses two single-statement migrations:

1. Add `expected_lifetime_m`.
2. Copy legacy `expected_lifetime_km` values multiplied by 1,000.

The obsolete physical kilometre column remains unused for compatibility. Application types,
queries, writes, and current Drizzle metadata use `expectedLifetimeM`.

## Verification

- TypeScript typecheck passed.
- ESLint passed with the pre-existing `i18next.use` warning only.
- 107 unit tests passed.
- Migration startup was verified on the Android emulator.
- Header overflow menus and component wear progress were verified on the Android emulator.
- Fifteen user-facing routes were captured and inspected in explicit light and dark themes,
  including populated details, empty maintenance states, forms, and the ride recorder.
- No visual inconsistency required an additional code change. The floating gear visible in
  screenshots is the Expo development-client overlay.

