import type { Ride } from './types';

export interface BikeStats {
  rideCount: number;
  totalDistanceM: number;
  totalTimeMs: number;
  longestRideM: number;
  averageRideM: number;
}

const EMPTY_BIKE_STATS: BikeStats = {
  rideCount: 0,
  totalDistanceM: 0,
  totalTimeMs: 0,
  longestRideM: 0,
  averageRideM: 0,
};

/** Aggregate stats for a bike's rides: total distance, total time, longest and average ride. */
export function computeBikeStats(rides: Ride[]): BikeStats {
  if (rides.length === 0) {
    return EMPTY_BIKE_STATS;
  }

  let totalDistanceM = 0;
  let totalTimeMs = 0;
  let longestRideM = 0;

  for (const ride of rides) {
    totalDistanceM += ride.distanceM;
    totalTimeMs += ride.endedAt.getTime() - ride.startedAt.getTime();
    if (ride.distanceM > longestRideM) {
      longestRideM = ride.distanceM;
    }
  }

  return {
    rideCount: rides.length,
    totalDistanceM,
    totalTimeMs,
    longestRideM,
    averageRideM: totalDistanceM / rides.length,
  };
}

export interface RideDayGroup {
  /** local-date key, e.g. '2026-07-11' */
  dateKey: string;
  rides: Ride[];
}

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Groups rides by local calendar day, newest day first, and newest ride first within a day. */
export function groupRidesByDay(rides: Ride[]): RideDayGroup[] {
  const map = new Map<string, Ride[]>();

  for (const ride of rides) {
    const key = dayKey(ride.startedAt);
    const group = map.get(key);
    if (group) {
      group.push(ride);
    } else {
      map.set(key, [ride]);
    }
  }

  return Array.from(map.entries())
    .map(([dateKey, dayRides]) => ({
      dateKey,
      rides: [...dayRides].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()),
    }))
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}
