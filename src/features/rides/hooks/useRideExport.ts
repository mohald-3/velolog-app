import { useMutation } from '@tanstack/react-query';

import type { Ride } from '../../../domain/types';
import { exportRideGpxAsync } from '../../../services/gpxExport';

export function useRideExport() {
  return useMutation({
    mutationFn: ({ ride, dialogTitle }: { ride: Ride; dialogTitle: string }) =>
      exportRideGpxAsync(ride, dialogTitle),
  });
}
