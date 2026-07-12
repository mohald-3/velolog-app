import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { bikeRepository } from '../../../data/repositories/bikeRepository';
import { rideRepository } from '../../../data/repositories/rideRepository';
import { computeOdometerM } from '../../../domain/odometer';
import type { NewRide, RideUpdate } from '../../../domain/types';
import { checkMaintenanceNotifications } from '../../../services/notifications';

const ridesKey = (bikeId: string) => ['bikes', bikeId, 'rides'] as const;
const rideKey = (id: string) => ['rides', id] as const;

/** Notifies on any maintenance rule that crossed into a more urgent due-status as a result of
 * this bike's odometer changing by `distanceDeltaM` (positive for a new ride, negative for a
 * deleted one). */
async function notifyOnOdometerChange(bikeId: string, distanceDeltaM: number): Promise<void> {
  const [bike, rides] = await Promise.all([
    bikeRepository.getById(bikeId),
    rideRepository.list({ bikeId }),
  ]);
  if (!bike) return;

  const newOdometerM = computeOdometerM(bike, rides);
  const previousOdometerM = newOdometerM - distanceDeltaM;
  await checkMaintenanceNotifications(bikeId, previousOdometerM, newOdometerM);
}

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
      void notifyOnOdometerChange(created.bikeId, created.distanceM);
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

export function useDeleteRide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; bikeId: string; distanceM: number }) => rideRepository.softDelete(id),
    onSuccess: (_result, { id, bikeId, distanceM }) => {
      queryClient.invalidateQueries({ queryKey: ridesKey(bikeId) });
      queryClient.invalidateQueries({ queryKey: rideKey(id) });
      void notifyOnOdometerChange(bikeId, -distanceM);
    },
  });
}
