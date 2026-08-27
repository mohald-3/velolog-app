import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { bikeRepository } from '../../../data/repositories/bikeRepository';
import { rideRepository } from '../../../data/repositories/rideRepository';
import { computeOdometerM } from '../../../domain/odometer';
import type { NewRide, RideUpdate } from '../../../domain/types';
import { checkMaintenanceNotifications } from '../../../services/notifications';
import { computeTrackElevationGainAsync } from '../../../services/rideElevation';
import { queryKeys } from '../../queryKeys';

/** Notifies on any maintenance rule that crossed into a more urgent due-status as a result of
 * this bike's odometer changing by `distanceDeltaM` (positive for a new ride, negative for a
 * deleted one). */
export async function notifyOnOdometerChange(bikeId: string, distanceDeltaM: number): Promise<void> {
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
    queryKey: queryKeys.rides(bikeId ?? ''),
    queryFn: () => rideRepository.list({ bikeId: bikeId as string }),
    enabled: Boolean(bikeId),
  });
}

export function useRide(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.ride(id ?? ''),
    queryFn: () => rideRepository.getById(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateRide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewRide) => rideRepository.create(input),
    // RecordRideScreen owns the failure UX here (retry alert, ride kept recoverable on disk) —
    // the global mutation error alert would double up on it.
    meta: { suppressErrorAlert: true },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rides(created.bikeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journey });
      void notifyOnOdometerChange(created.bikeId, created.distanceM);
    },
  });
}

export function useUpdateRide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: RideUpdate }) => rideRepository.update(id, changes),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rides(updated.bikeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.ride(updated.id) });
    },
  });
}

export function useRecomputeRideElevation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, trackUri }: { id: string; trackUri: string }) => {
      const elevationGainM = await computeTrackElevationGainAsync(trackUri);
      return rideRepository.updateElevationGain(id, elevationGainM);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rides(updated.bikeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.ride(updated.id) });
    },
  });
}

export function useDeleteRide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; bikeId: string; distanceM: number }) => rideRepository.softDelete(id),
    onSuccess: (_result, { id, bikeId, distanceM }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rides(bikeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.ride(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journey });
      void notifyOnOdometerChange(bikeId, -distanceM);
    },
  });
}
