import { buildRideTrendBuckets } from './ride-trends';
import type { Ride } from './types';

function ride(startedAt: Date, distanceM: number, bikeId = 'bike-1', deletedAt: Date | null = null): Ride {
  return {
    id: `${startedAt.toISOString()}-${bikeId}`, bikeId, startedAt,
    endedAt: new Date(startedAt.getTime() + 3_600_000), distanceM, movingTimeMs: 3_600_000,
    pausedTimeMs: 0, trackUri: 'track', elevationGainM: null, source: 'recorded', notes: null,
    deletedAt, createdAt: startedAt, updatedAt: startedAt,
  };
}

describe('buildRideTrendBuckets', () => {
  it('uses Monday local weeks across a year boundary and fills gaps', () => {
    const buckets = buildRideTrendBuckets([
      ride(new Date(2025, 11, 29, 12), 1000),
      ride(new Date(2026, 0, 11, 12), 2000),
    ], { period: 'week', bucketCount: 3, now: new Date(2026, 0, 11, 20) });
    expect(buckets.map((bucket) => [bucket.start.getFullYear(), bucket.start.getMonth(), bucket.start.getDate()])).toEqual([
      [2025, 11, 22], [2025, 11, 29], [2026, 0, 5],
    ]);
    expect(buckets.map((bucket) => bucket.distanceM)).toEqual([0, 1000, 2000]);
  });

  it('handles leap-year months and filters deleted or other-bike rides', () => {
    const buckets = buildRideTrendBuckets([
      ride(new Date(2024, 1, 29, 12), 1000),
      ride(new Date(2024, 2, 1, 12), 2000, 'bike-2'),
      ride(new Date(2024, 2, 2, 12), 3000, 'bike-1', new Date()),
    ], { period: 'month', bucketCount: 2, now: new Date(2024, 2, 15), bikeId: 'bike-1' });
    expect(buckets.map((bucket) => bucket.distanceM)).toEqual([1000, 0]);
    expect(buckets[0].end).toEqual(new Date(2024, 2, 1));
  });

  it('uses local boundaries through DST and supports empty/invalid counts', () => {
    const buckets = buildRideTrendBuckets([], { period: 'week', bucketCount: 2, now: new Date(2026, 2, 30, 12) });
    expect(buckets).toHaveLength(2);
    expect(buckets.every((bucket) => bucket.start.getHours() === 0 && bucket.distanceM === 0)).toBe(true);
    expect(buildRideTrendBuckets([], { period: 'month', bucketCount: 0 })).toEqual([]);
  });
});
