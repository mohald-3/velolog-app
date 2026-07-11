import {
  accumulateDistanceM,
  applyGpsFilters,
  computeMovingStats,
  filterByAccuracy,
  filterImplausibleJumps,
  haversineDistanceM,
  shouldAutoPause,
  speedKmh,
} from './gps-filter';
import type { RawGpsPoint } from './gps-filter';

const ORIGIN = { lat: 59.3293, lon: 18.0686 }; // Stockholm, arbitrary reference

/** One degree of longitude shrinks with latitude; build points along a straight line north so
 * distances are simple to reason about (~111.32m per 0.001 deg latitude). */
function pointAt(ts: number, latOffsetDeg: number, accuracyM: number | null = 5): RawGpsPoint {
  return { ts, lat: ORIGIN.lat + latOffsetDeg, lon: ORIGIN.lon, accuracyM };
}

describe('haversineDistanceM', () => {
  it('returns 0 for identical points', () => {
    expect(haversineDistanceM(ORIGIN, ORIGIN)).toBe(0);
  });

  it('matches the ~111.32m/0.001deg latitude approximation within 1%', () => {
    const a = ORIGIN;
    const b = { lat: ORIGIN.lat + 0.001, lon: ORIGIN.lon };
    const distM = haversineDistanceM(a, b);
    expect(distM).toBeGreaterThan(110.2);
    expect(distM).toBeLessThan(112.4);
  });
});

describe('filterByAccuracy', () => {
  it('drops points worse than the threshold', () => {
    const points = [pointAt(0, 0, 10), pointAt(1000, 0.0001, 30), pointAt(2000, 0.0002, 20)];
    const result = filterByAccuracy(points, 25);
    expect(result.map((p) => p.ts)).toEqual([0, 2000]);
  });

  it('keeps points with null accuracy rather than dropping unknown-quality fixes', () => {
    const points = [pointAt(0, 0, null), pointAt(1000, 0.0001, 999)];
    const result = filterByAccuracy(points, 25);
    expect(result.map((p) => p.ts)).toEqual([0]);
  });

  it('keeps a point exactly at the threshold', () => {
    const points = [pointAt(0, 0, 25)];
    expect(filterByAccuracy(points, 25)).toHaveLength(1);
  });
});

describe('filterImplausibleJumps', () => {
  it('keeps a normal cycling-pace track intact', () => {
    // ~20 km/h: 5.56 m/s, 1s ticks -> ~0.00005 deg latitude per tick
    const points = [
      pointAt(0, 0),
      pointAt(1000, 0.00005),
      pointAt(2000, 0.0001),
      pointAt(3000, 0.00015),
    ];
    expect(filterImplausibleJumps(points)).toHaveLength(4);
  });

  it('drops a single teleport point implying >90 km/h', () => {
    const points = [
      pointAt(0, 0),
      pointAt(1000, 0.00005), // normal
      pointAt(2000, 0.05), // ~5.5km in 1s — GPS glitch
      pointAt(3000, 0.0002), // back to normal pace from the last GOOD point
    ];
    const result = filterImplausibleJumps(points);
    expect(result.map((p) => p.ts)).toEqual([0, 1000, 3000]);
  });

  it('evaluates against the last kept point, not the last raw point (no cascading false keeps)', () => {
    const points = [
      pointAt(0, 0),
      pointAt(1000, 0.05), // glitch, dropped
      pointAt(1500, 0.0501), // still near the glitch, implausible vs last KEPT (ts=0) -> dropped
      pointAt(2000, 0.0002), // plausible vs last kept (ts=0): 0.0002deg/2s ~ 11.1m/s ~ 40km/h, ok
    ];
    const result = filterImplausibleJumps(points);
    expect(result.map((p) => p.ts)).toEqual([0, 2000]);
  });

  it('drops out-of-order or duplicate-timestamp points', () => {
    const points = [pointAt(1000, 0), pointAt(1000, 0.0001), pointAt(500, 0.0002)];
    const result = filterImplausibleJumps(points);
    expect(result.map((p) => p.ts)).toEqual([1000]);
  });

  it('returns an empty array for an empty input', () => {
    expect(filterImplausibleJumps([])).toEqual([]);
  });
});

describe('applyGpsFilters', () => {
  it('composes accuracy filtering then jump filtering', () => {
    const points = [
      pointAt(0, 0, 5),
      pointAt(1000, 0.00005, 999), // bad accuracy, dropped first
      pointAt(2000, 0.05, 5), // would-be teleport from ts=0 after accuracy drop
      pointAt(3000, 0.0002, 5),
    ];
    const result = applyGpsFilters(points);
    expect(result.map((p) => p.ts)).toEqual([0, 3000]);
  });
});

describe('accumulateDistanceM', () => {
  it('sums consecutive haversine distances', () => {
    const points = [pointAt(0, 0), pointAt(1000, 0.001), pointAt(2000, 0.002)];
    const total = accumulateDistanceM(points);
    const expected = haversineDistanceM(points[0], points[1]) + haversineDistanceM(points[1], points[2]);
    expect(total).toBeCloseTo(expected, 6);
  });

  it('returns 0 for fewer than 2 points', () => {
    expect(accumulateDistanceM([pointAt(0, 0)])).toBe(0);
    expect(accumulateDistanceM([])).toBe(0);
  });
});

describe('computeMovingStats', () => {
  it('splits a track into moving and paused segments by implied speed', () => {
    const points = [
      // moving: ~20km/h for 3 ticks
      pointAt(0, 0),
      pointAt(1000, 0.00005),
      pointAt(2000, 0.0001),
      // stopped at a light: tiny GPS drift over 30s, well under the 2km/h threshold
      pointAt(32000, 0.000105),
      pointAt(62000, 0.00011),
      // moving again
      pointAt(63000, 0.00016),
    ];
    const stats = computeMovingStats(points);
    expect(stats.totalTimeMs).toBe(63000);
    expect(stats.pausedTimeMs).toBe(30000 + 30000); // the two 30s stationary segments
    expect(stats.movingTimeMs).toBe(63000 - stats.pausedTimeMs);
    expect(stats.distanceM).toBeGreaterThan(0);
  });

  it('treats a genuinely stationary track (zero movement) as fully paused', () => {
    const points = [pointAt(0, 0), pointAt(10000, 0), pointAt(20000, 0)];
    const stats = computeMovingStats(points);
    expect(stats.movingTimeMs).toBe(0);
    expect(stats.pausedTimeMs).toBe(20000);
    expect(stats.distanceM).toBe(0);
  });

  it('returns all-zero stats for fewer than 2 points', () => {
    expect(computeMovingStats([pointAt(0, 0)])).toEqual({
      distanceM: 0,
      movingTimeMs: 0,
      pausedTimeMs: 0,
      totalTimeMs: 0,
    });
  });
});

describe('shouldAutoPause', () => {
  it('returns true when implied speed is below the threshold', () => {
    // 1m in 10s = 0.1 m/s = 0.36 km/h
    expect(shouldAutoPause(1, 10000)).toBe(true);
  });

  it('returns false when implied speed is at/above the threshold', () => {
    // 10m in 10s = 1 m/s = 3.6 km/h
    expect(shouldAutoPause(10, 10000)).toBe(false);
  });

  it('returns false for a non-positive duration rather than dividing by zero', () => {
    expect(shouldAutoPause(5, 0)).toBe(false);
    expect(shouldAutoPause(5, -100)).toBe(false);
  });
});

describe('speedKmh', () => {
  it('converts distance and duration to km/h', () => {
    // 1000m in 1 hour = 1 km/h
    expect(speedKmh(1000, 3_600_000)).toBeCloseTo(1, 6);
    // 10000m in 1 hour = 10 km/h
    expect(speedKmh(10_000, 3_600_000)).toBeCloseTo(10, 6);
  });

  it('returns 0 for a non-positive duration rather than dividing by zero', () => {
    expect(speedKmh(100, 0)).toBe(0);
    expect(speedKmh(100, -1)).toBe(0);
  });
});
