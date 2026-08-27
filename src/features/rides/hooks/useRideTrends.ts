import { useQuery } from '@tanstack/react-query';

import { rideRepository } from '../../../data/repositories/rideRepository';
import { queryKeys } from '../../queryKeys';

export function useRideTrendRides() {
  return useQuery({ queryKey: queryKeys.rideTrends, queryFn: () => rideRepository.list() });
}
