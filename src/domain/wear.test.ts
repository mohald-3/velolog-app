import { computeComponentWearM } from './wear';

describe('computeComponentWearM', () => {
  it('returns the distance ridden since install', () => {
    expect(computeComponentWearM(5000, 1000)).toBe(4000);
  });

  it('returns 0 when installed at the current odometer reading', () => {
    expect(computeComponentWearM(1000, 1000)).toBe(0);
  });

  it('clamps at 0 rather than going negative for bad data (e.g. installedAtOdometerM entered too high)', () => {
    expect(computeComponentWearM(1000, 5000)).toBe(0);
  });

  it('handles a zero starting odometer', () => {
    expect(computeComponentWearM(2500, 0)).toBe(2500);
  });
});
