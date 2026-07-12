import type { Bike, MaintenanceRecord, Ride } from './types';

/** Notable real-world distances (by road, one-way, km) used as milestones for the journey
 * screen's "you've ridden further than..." checklist. IDs are translation keys — the labels
 * are localized in src/i18n, not stored here, since this module stays UI/locale-agnostic. */
const DISTANCE_MILESTONES_KM: { id: string; distanceKm: number }[] = [
  { id: 'stockholmUppsala', distanceKm: 71 },
  { id: 'stockholmNorrkoping', distanceKm: 165 },
  { id: 'stockholmGothenburg', distanceKm: 470 },
  { id: 'stockholmMalmo', distanceKm: 615 },
  { id: 'stockholmCopenhagen', distanceKm: 645 },
  { id: 'stockholmBerlin', distanceKm: 820 },
  { id: 'stockholmParis', distanceKm: 1620 },
  { id: 'aroundTheEquator', distanceKm: 40_075 },
];

export interface MilestoneProgress {
  id: string;
  distanceM: number;
  reached: boolean;
  /** Meters still needed to reach this milestone; 0 once reached. */
  remainingM: number;
}

/** Checklist of milestone progress against the total distance ridden, in a fixed ascending
 * order — the "Stockholm → Copenhagen ✓" style list from the project's journey screen vision. */
export function computeMilestoneProgress(totalDistanceM: number): MilestoneProgress[] {
  return DISTANCE_MILESTONES_KM.map(({ id, distanceKm }) => {
    const distanceM = distanceKm * 1000;
    const reached = totalDistanceM >= distanceM;
    return { id, distanceM, reached, remainingM: reached ? 0 : distanceM - totalDistanceM };
  });
}

// EPA-cited average passenger vehicle tailpipe emissions: ~404 g CO2 per mile ≈ 251 g/km.
const CAR_CO2_GRAMS_PER_KM = 251;

// Rough estimate for moderate-effort leisure cycling; without the rider's weight or power
// data this can't be precise, so it's a single average rather than a per-ride calculation.
const CALORIES_PER_KM = 35;

export interface JourneyStats {
  totalDistanceM: number;
  totalRideCount: number;
  /** Sum of all bikes' purchase prices plus all maintenance record costs, in whatever
   * currency they were entered — the app doesn't yet track or convert currency, so mixed
   * currencies are summed naively. Null when there's no distance to divide by. */
  totalCost: number;
  co2SavedKg: number;
  caloriesBurned: number;
  milestones: MilestoneProgress[];
}

/** Aggregates journey-level stats across the whole garage: every bike (including archived —
 * a bike being retired from active use doesn't erase how far it carried you), every
 * non-deleted ride, and every maintenance record. */
export function computeJourneyStats(
  bikes: Bike[],
  rides: Ride[],
  maintenanceRecords: MaintenanceRecord[]
): JourneyStats {
  const totalDistanceM = rides.reduce((sum, ride) => sum + ride.distanceM, 0);
  const totalDistanceKm = totalDistanceM / 1000;

  const totalPurchaseCost = bikes.reduce((sum, bike) => sum + (bike.purchasePrice ?? 0), 0);
  const totalMaintenanceCost = maintenanceRecords.reduce((sum, record) => sum + (record.cost ?? 0), 0);

  return {
    totalDistanceM,
    totalRideCount: rides.length,
    totalCost: totalPurchaseCost + totalMaintenanceCost,
    co2SavedKg: (totalDistanceKm * CAR_CO2_GRAMS_PER_KM) / 1000,
    caloriesBurned: totalDistanceKm * CALORIES_PER_KM,
    milestones: computeMilestoneProgress(totalDistanceM),
  };
}
