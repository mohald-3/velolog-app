import { useQuery } from '@tanstack/react-query';

import { bikeRepository } from '../../../data/repositories/bikeRepository';
import { maintenanceRecordRepository } from '../../../data/repositories/maintenanceRecordRepository';
import { rideRepository } from '../../../data/repositories/rideRepository';
import { computeJourneyStats, type JourneyStats } from '../../../domain/journey';
import { queryKeys } from '../../queryKeys';

/** Aggregates across the whole garage (including archived bikes) — a top-level, cross-cutting
 * view rather than one scoped to a single bike, so it doesn't share a query key with the
 * per-bike hooks in useBikes/useRides and instead just refetches on every screen focus. */
export function useJourneyStats(): { data: JourneyStats | undefined; isLoading: boolean } {
  const bikesQuery = useQuery({
    queryKey: queryKeys.journeyBikes,
    queryFn: () => bikeRepository.list({ includeArchived: true }),
  });
  const ridesQuery = useQuery({
    queryKey: queryKeys.journeyRides,
    queryFn: () => rideRepository.list(),
  });
  const recordsQuery = useQuery({
    queryKey: queryKeys.journeyRecords,
    queryFn: () => maintenanceRecordRepository.listAll(),
  });

  const isLoading = bikesQuery.isLoading || ridesQuery.isLoading || recordsQuery.isLoading;
  const data =
    bikesQuery.data && ridesQuery.data && recordsQuery.data
      ? computeJourneyStats(bikesQuery.data, ridesQuery.data, recordsQuery.data)
      : undefined;

  return { data, isLoading };
}
