import type { Ride } from './types';

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
