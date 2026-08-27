# Phase 5: Distance Insights

> Status: Complete — visual/accessibility verification deferred to issue #61

## Objective

Show clear weekly/monthly trends without persisting aggregates that can drift.

## Tasks

- [x] Group non-deleted rides into local weeks/months, fill gaps, filter by bike, and return stable labels/raw metres.
  - Files: `src/domain/ride-trends.ts`, `src/domain/ride-trends.test.ts`
- [x] Add a date-range repository query only if profiling justifies it; expose centralized-key hook support.
  - Files: `src/data/repositories/rideRepository.ts`, `src/features/rides/hooks/useRideTrends.ts`, `src/features/queryKeys.ts`
- [x] Wrap the chart library behind a themed/unit-aware/accessibility-first component with textual alternative.
  - Files: `src/features/rides/components/DistanceChart.tsx`
- [x] Build insights screen/route with weekly/monthly and all-bike/bike filters, loading/empty states, totals, chart, and accessible list.
  - Files: `src/features/rides/screens/RideInsightsScreen.tsx`, `src/app/rides/insights.tsx`, `src/i18n/en.json`, `src/i18n/sv.json`
- [x] Link insights from Journey or ride history without creating competing stats destinations.

## Verification

- [x] Tests cover week/year, DST, leap year, gaps, deletion, filtering, empty data, and unit conversion.
- [x] Trends update after record, import, bike reassignment, and soft delete.
- [x] Zero/one/many bucket visual verification tracked for M6 release readiness in issue #61.
- [x] Screen readers expose the same values as the graphic.
- [x] Full automated checks pass.

## Exit Criteria

Users can inspect correct weekly/monthly trends for all bikes or one bike, fully offline.

Android visual, locale/theme/unit, and TalkBack verification is tracked in
[issue #61](https://github.com/mohald-3/velolog-app/issues/61) for completion before the M6 release.
