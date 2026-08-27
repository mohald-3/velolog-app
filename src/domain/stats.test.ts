import { computeBikeStats, groupRidesByDay } from './stats';
import type { Ride } from './types';

let seq = 0;

function makeRide(startedAt: Date, overrides: Partial<Ride> = {}): Ride {
  seq += 1;
  return {
    id: `ride-${seq}`,
    bikeId: 'bike-1',
    startedAt,
    endedAt: new Date(startedAt.getTime() + 60_000),
    distanceM: 1000,
    movingTimeMs: 60_000,
    pausedTimeMs: 0,
    trackUri: `file:///rides/ride-${seq}.ndjson`,
    elevationGainM: null,
    source: 'recorded',
    notes: null,
    deletedAt: null,
    createdAt: startedAt,
    updatedAt: startedAt,
    ...overrides,
  };
}

describe('groupRidesByDay', () => {
  it('groups rides on the same local day together', () => {
    const morning = makeRide(new Date(2026, 6, 11, 8, 0));
    const evening = makeRide(new Date(2026, 6, 11, 18, 0));

    const groups = groupRidesByDay([morning, evening]);

    expect(groups).toHaveLength(1);
    expect(groups[0].dateKey).toBe('2026-07-11');
    expect(groups[0].rides).toHaveLength(2);
  });

  it('orders rides within a day newest first', () => {
    const morning = makeRide(new Date(2026, 6, 11, 8, 0));
    const evening = makeRide(new Date(2026, 6, 11, 18, 0));

    const groups = groupRidesByDay([morning, evening]);

    expect(groups[0].rides.map((r) => r.id)).toEqual([evening.id, morning.id]);
  });

  it('orders day groups newest day first', () => {
    const older = makeRide(new Date(2026, 6, 9, 8, 0));
    const newer = makeRide(new Date(2026, 6, 11, 8, 0));

    const groups = groupRidesByDay([older, newer]);

    expect(groups.map((g) => g.dateKey)).toEqual(['2026-07-11', '2026-07-09']);
  });

  it('returns an empty array for no rides', () => {
    expect(groupRidesByDay([])).toEqual([]);
  });

  it('treats rides just before and after local midnight as different days', () => {
    const lateNight = makeRide(new Date(2026, 6, 11, 23, 59));
    const earlyMorning = makeRide(new Date(2026, 6, 12, 0, 1));

    const groups = groupRidesByDay([lateNight, earlyMorning]);

    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.dateKey)).toEqual(['2026-07-12', '2026-07-11']);
  });
});

describe('computeBikeStats', () => {
  it('returns zeroed stats for no rides', () => {
    expect(computeBikeStats([])).toEqual({
      rideCount: 0,
      totalDistanceM: 0,
      totalTimeMs: 0,
      longestRideM: 0,
      averageRideM: 0,
    });
  });

  it('sums distance and time, and finds the longest and average ride', () => {
    const short = makeRide(new Date(2026, 6, 11, 8, 0), {
      distanceM: 1000,
      endedAt: new Date(2026, 6, 11, 8, 10),
    });
    const long = makeRide(new Date(2026, 6, 12, 8, 0), {
      distanceM: 5000,
      endedAt: new Date(2026, 6, 12, 8, 30),
    });

    const stats = computeBikeStats([short, long]);

    expect(stats.rideCount).toBe(2);
    expect(stats.totalDistanceM).toBe(6000);
    expect(stats.totalTimeMs).toBe(10 * 60_000 + 30 * 60_000);
    expect(stats.longestRideM).toBe(5000);
    expect(stats.averageRideM).toBe(3000);
  });

  it('handles a single ride', () => {
    const ride = makeRide(new Date(2026, 6, 11, 8, 0), { distanceM: 2500 });

    const stats = computeBikeStats([ride]);

    expect(stats.rideCount).toBe(1);
    expect(stats.totalDistanceM).toBe(2500);
    expect(stats.longestRideM).toBe(2500);
    expect(stats.averageRideM).toBe(2500);
  });
});
