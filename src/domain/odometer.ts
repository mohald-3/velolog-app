import type { Bike, Ride } from './types';

/**
 * A bike's odometer is always derived from its starting baseline plus every completed ride's
 * distance — never a separately stored/mutated counter that can drift out of sync with the
 * rides that supposedly produced it.
 */
export function computeOdometerM(
  bike: Pick<Bike, 'startingOdometerM'>,
  rides: Pick<Ride, 'distanceM'>[]
): number {
  return bike.startingOdometerM + rides.reduce((sum, ride) => sum + ride.distanceM, 0);
}
