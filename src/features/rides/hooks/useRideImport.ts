import { useMutation, useQueryClient } from '@tanstack/react-query';

import { rideRepository } from '../../../data/repositories/rideRepository';
import type { GpxImportSummary } from '../../../domain/gpx-import';
import { deleteImportedTrackAsync, writeImportedTrackAsync } from '../../../services/gpxImport';
import { queryKeys } from '../../queryKeys';
import { notifyOnOdometerChange } from './useRides';

export function useSaveGpxImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bikeId, summary }: { bikeId: string; summary: GpxImportSummary }) => {
      const trackUri = await writeImportedTrackAsync(summary.points);
      try {
        return await rideRepository.create({
          bikeId,
          startedAt: summary.startedAt,
          endedAt: summary.endedAt,
          distanceM: summary.distanceM,
          movingTimeMs: summary.movingTimeMs,
          pausedTimeMs: summary.pausedTimeMs,
          elevationGainM: summary.elevationGainM,
          trackUri,
          source: 'gpx',
        });
      } catch (error) {
        await deleteImportedTrackAsync(trackUri).catch(() => {});
        throw error;
      }
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rides(created.bikeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.journey });
      queryClient.invalidateQueries({ queryKey: queryKeys.rideTrends });
      void notifyOnOdometerChange(created.bikeId, created.distanceM);
    },
  });
}
