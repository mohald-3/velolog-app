# Phase 1: Contracts, Spikes, and Migration

> Status: Complete
> Started: 2026-08-27
> Completed: 2026-08-27

## Objective

Resolve technical uncertainty, establish backward-compatible contracts, and land the shared schema foundation.

## Tasks

- [x] **Define elevation behavior**: Specify validity, vertical-accuracy handling, smoothing, ascent threshold, and null-vs-zero semantics; create flat/noisy/climb/descent/missing fixtures.
  - Files: `src/domain/elevation.ts`, `src/domain/elevation.test.ts`
  - Pattern: `.claude/patterns/domain-module-template.md`
- [x] **Spike dependencies**: Evaluate a real XML parser against GPX variants and a chart library against Expo 57, theming, accessibility, and 12+ buckets. Define GPX byte/point limits and fallback choices in `STATE.md`.
  - Files: `package.json`, `src/domain/__fixtures__/gpx/`, optional temporary dev route
  - Result: `fast-xml-parser` GPX 1.0/1.1 smoke tests pass. Expo-compatible `react-native-svg`
    rendered 12 themed bars in EAS development build `3f725592-0ddf-4fe8-b1fa-b5f823e7dfbb`.
- [x] **Extend persistence**: Add optional altitude fields to raw points and nullable `elevationGainM` plus source to rides; update repository mappings and generate/inspect a Drizzle migration that preserves old rows.
  - Files: `src/domain/gps-filter.ts`, `src/domain/types.ts`, `src/data/schema.ts`, `src/data/repositories/rideRepository.ts`, `drizzle/`
  - Pattern: `.claude/patterns/repository-template.md`
- [x] **Extend formatting**: Add metres/feet elevation formatting with boundary tests.
  - Files: `src/domain/units.ts`, `src/domain/units.test.ts`

## Verification

- [x] Migration upgrades an existing emulator database without data loss.
- [x] Existing NDJSON without altitude parses unchanged.
- [x] XML/chart choices build in the Android development client.
- [x] Full typecheck, lint, and tests pass.

## Exit Criteria

Contracts are backward compatible, dependency spikes are proven, and later phases need no reopened foundation decisions.

## Summary

Added backward-compatible altitude/ride-source contracts, generated migration `0009`, defined and
tested the elevation smoothing contract, added elevation unit formatting, selected and smoke-tested
the GPX/SVG dependencies, and verified the native SVG chart in a rebuilt EAS Android dev client.
