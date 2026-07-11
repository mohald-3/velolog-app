import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { NewRide, RideUpdate } from '../../../domain/types';
import { rideRepository } from '../../../data/repositories/rideRepository';

const ridesKey = (bikeId: string) => ['bikes', bikeId, 'rides'] as const;
const rideKey = (id: string) => ['rides', id] as const;

export function useRides(bikeId: string | undefined) {
  return useQuery({
    queryKey: ridesKey(bikeId ?? ''),
    queryFn: () => rideRepository.list({ bikeId: bikeId as string }),
    enabled: Boolean(bikeId),
  });
}

export function useRide(id: string | undefined) {
  return useQuery({
    queryKey: rideKey(id ?? ''),
    queryFn: () => rideRepository.getById(id as string),
    enabled: Boolean(id),
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

export function useUpdateRide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: RideUpdate }) => rideRepository.update(id, changes),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ridesKey(updated.bikeId) });
      queryClient.invalidateQueries({ queryKey: rideKey(updated.id) });
    },
  });
}
