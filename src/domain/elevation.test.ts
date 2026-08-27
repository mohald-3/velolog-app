import type { RawGpsPoint } from './gps-filter';
import { computeElevationGainM } from './elevation';

function track(altitudes: (number | null)[], accuracies?: (number | null)[]): RawGpsPoint[] {
  return altitudes.map((altitudeM, index) => ({
    ts: index * 1000,
    lat: 59 + index * 0.0001,
    lon: 18,
    accuracyM: 5,
    altitudeM,
    verticalAccuracyM: accuracies?.[index] ?? 5,
  }));
}

describe('computeElevationGainM', () => {
  it('returns null when fewer than three usable altitude samples remain', () => {
    expect(computeElevationGainM(track([null, 10, 11]))).toBeNull();
    expect(computeElevationGainM([])).toBeNull();
  });

  it('returns zero for a flat track with ordinary GPS jitter', () => {
    expect(computeElevationGainM(track([100, 101, 99.5, 101.5, 100, 99]))).toBe(0);
  });

  it('accumulates a gradual climb even when individual steps are below the threshold', () => {
    expect(computeElevationGainM(track([100, 102, 104, 106, 108, 110]))).toBe(8);
  });

  it('adds separate climbs after a meaningful descent', () => {
    expect(computeElevationGainM(track([100, 100, 104, 108, 108, 103, 98, 98, 102, 106, 106]))).toBe(16);
  });

  it('does not count a descent-only track as climbing', () => {
    expect(computeElevationGainM(track([110, 108, 106, 104, 102, 100]))).toBe(0);
  });

  it('median-filters an isolated altitude spike', () => {
    expect(computeElevationGainM(track([100, 100, 150, 100, 100]))).toBe(0);
  });

  it('rejects samples whose vertical accuracy exceeds the default', () => {
    const points = track([100, 150, 103, 106], [5, 50, 5, 5]);
    expect(computeElevationGainM(points)).toBe(6);
  });

  it('keeps samples with unknown vertical accuracy', () => {
    const points = track([100, 104, 108], [null, null, null]);
    expect(computeElevationGainM(points)).toBe(8);
  });

  it('ignores non-finite altitude and accuracy values', () => {
    const points = track([100, Number.NaN, 104, 108], [5, 5, Number.POSITIVE_INFINITY, 5]);
    expect(computeElevationGainM(points)).toBeNull();
  });

  it('allows thresholds to be tuned explicitly', () => {
    expect(
      computeElevationGainM(track([100, 101, 102, 103]), { minElevationChangeM: 1 })
    ).toBe(3);
  });
});
