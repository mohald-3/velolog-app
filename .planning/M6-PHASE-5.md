# Phase 5: Distance Insights

> Status: Pending

## Objective

Show clear weekly/monthly trends without persisting aggregates that can drift.

## Tasks

- [ ] Group non-deleted rides into local weeks/months, fill gaps, filter by bike, and return stable labels/raw metres.
  - Files: `src/domain/ride-trends.ts`, `src/domain/ride-trends.test.ts`
- [ ] Add a date-range repository query only if profiling justifies it; expose centralized-key hook support.
  - Files: `src/data/repositories/rideRepository.ts`, `src/features/rides/hooks/useRideTrends.ts`, `src/features/queryKeys.ts`
- [ ] Wrap the chart library behind a themed/unit-aware/accessibility-first component with textual alternative.
  - Files: `src/features/rides/components/DistanceChart.tsx`
- [ ] Build insights screen/route with weekly/monthly and all-bike/bike filters, loading/empty states, totals, chart, and accessible list.
  - Files: `src/features/rides/screens/RideInsightsScreen.tsx`, `src/app/rides/insights.tsx`, `src/i18n/en.json`, `src/i18n/sv.json`
- [ ] Link insights from Journey or ride history without creating competing stats destinations.

## Verification

- [ ] Tests cover week/year, DST, leap year, gaps, deletion, filtering, empty data, and unit conversion.
- [ ] Trends update after record, import, bike reassignment, and soft delete.
- [ ] Zero/one/many buckets work in both locales/themes/units.
- [ ] Screen readers expose the same values as the graphic.
- [ ] Full automated checks pass.

## Exit Criteria

Users can inspect correct weekly/monthly trends for all bikes or one bike, fully offline.
