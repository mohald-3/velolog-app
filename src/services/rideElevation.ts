import { computeElevationGainM } from '../domain/elevation';
import { applyGpsFilters } from '../domain/gps-filter';
import { readTrackPointsAsync } from './rideRecordingTask';

/** Recomputes the derived elevation summary without modifying the completed track file. */
export async function computeTrackElevationGainAsync(trackUri: string): Promise<number | null> {
  const points = applyGpsFilters(await readTrackPointsAsync(trackUri));
  return computeElevationGainM(points);
}
