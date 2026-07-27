import { computeComponentWearM, computeWearPercent } from './wear';

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

describe('computeWearPercent', () => {
  it('returns the percentage of expected lifetime consumed', () => {
    expect(computeWearPercent(2500, 10000)).toBe(25);
  });

  it('retains values above 100 for components past their expected lifetime', () => {
    expect(computeWearPercent(12500, 10000)).toBe(125);
  });

  it('clamps negative wear to zero', () => {
    expect(computeWearPercent(-500, 10000)).toBe(0);
  });

  it.each([0, -100])('returns zero for a non-positive lifetime (%s)', (lifetimeM) => {
    expect(computeWearPercent(500, lifetimeM)).toBe(0);
  });
});
