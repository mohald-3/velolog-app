import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { NewRide } from '../../../domain/types';
import { rideRepository } from '../../../data/repositories/rideRepository';

const ridesKey = (bikeId: string) => ['bikes', bikeId, 'rides'] as const;

export function useRides(bikeId: string | undefined) {
  return useQuery({
    queryKey: ridesKey(bikeId ?? ''),
    queryFn: () => rideRepository.list({ bikeId: bikeId as string }),
    enabled: Boolean(bikeId),
  });
}

export function useCreateRide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewRide) => rideRepository.create(input),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ridesKey(created.bikeId) });
    },
  });
}
