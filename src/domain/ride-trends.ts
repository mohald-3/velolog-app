import type { Ride } from './types';

export type TrendPeriod = 'week' | 'month';

export interface RideTrendBucket {
  start: Date;
  end: Date;
  distanceM: number;
  rideCount: number;
}

function startOfPeriod(date: Date, period: TrendPeriod): Date {
  if (period === 'month') return new Date(date.getFullYear(), date.getMonth(), 1);
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function addPeriods(date: Date, period: TrendPeriod, amount: number): Date {
  return period === 'month'
    ? new Date(date.getFullYear(), date.getMonth() + amount, 1)
    : new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount * 7);
}

/** Aggregates non-deleted rides into gap-filled local-calendar buckets without persisting totals. */
export function buildRideTrendBuckets(
  rides: Ride[],
  options: { period: TrendPeriod; bucketCount: number; now?: Date; bikeId?: string }
): RideTrendBucket[] {
  if (!Number.isInteger(options.bucketCount) || options.bucketCount <= 0) return [];
  const currentStart = startOfPeriod(options.now ?? new Date(), options.period);
  const firstStart = addPeriods(currentStart, options.period, -(options.bucketCount - 1));
  const buckets = Array.from({ length: options.bucketCount }, (_, index) => {
    const start = addPeriods(firstStart, options.period, index);
    return { start, end: addPeriods(start, options.period, 1), distanceM: 0, rideCount: 0 };
  });

  for (const ride of rides) {
    if (ride.deletedAt != null || (options.bikeId && ride.bikeId !== options.bikeId)) continue;
    const timestamp = ride.startedAt.getTime();
    const bucket = buckets.find(({ start, end }) => timestamp >= start.getTime() && timestamp < end.getTime());
    if (bucket) {
      bucket.distanceM += ride.distanceM;
      bucket.rideCount += 1;
    }
  }
  return buckets;
}
