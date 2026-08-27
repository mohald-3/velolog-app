import { summarizeGpxImport } from './gpx-import';
import type { ParsedGpx } from './gpx';

const point = (lat: number, lon: number, timestampMs: number | null, altitudeM: number | null = null) => ({
  lat, lon, timestampMs, altitudeM,
});

describe('summarizeGpxImport', () => {
  it('does not add phantom distance between segments', () => {
    const gpx: ParsedGpx = { name: null, segments: [
      [point(59, 18, 1000), point(59, 18.001, 2000)],
      [point(60, 19, 3000), point(60, 19.001, 4000)],
    ] };
    const summary = summarizeGpxImport(gpx);
    expect(summary.distanceM).toBeGreaterThan(100);
    expect(summary.distanceM).toBeLessThan(200);
    expect(summary.movingTimeMs).toBe(3000);
  });

  it('assigns deterministic timestamps when a fallback is supplied', () => {
    const gpx: ParsedGpx = { name: null, segments: [[point(59, 18, null), point(59.1, 18.1, null)]] };
    const summary = summarizeGpxImport(gpx, { startedAt: new Date(10_000), durationMs: 60_000 });
    expect(summary.points.map((p) => p.ts)).toEqual([10_000, 70_000]);
    expect(summary.endedAt.getTime()).toBe(70_000);
  });

  it('requires fallback time for missing timestamps and rejects reversed ranges', () => {
    expect(() => summarizeGpxImport({ name: null, segments: [[point(59, 18, null)]] })).toThrow('fallback');
    expect(() => summarizeGpxImport({ name: null, segments: [[point(59, 18, 2000), point(59, 18, 1000)]] })).toThrow('fallback');
  });
});
