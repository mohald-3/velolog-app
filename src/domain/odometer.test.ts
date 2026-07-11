import { computeOdometerM } from './odometer';

describe('computeOdometerM', () => {
  it('returns the starting baseline when there are no rides yet', () => {
    expect(computeOdometerM({ startingOdometerM: 400_000 }, [])).toBe(400_000);
  });

  it('adds a single ride distance to the baseline', () => {
    expect(computeOdometerM({ startingOdometerM: 400_000 }, [{ distanceM: 25_000 }])).toBe(425_000);
  });

  it('sums multiple rides', () => {
    const rides = [{ distanceM: 10_000 }, { distanceM: 15_500 }, { distanceM: 4_500 }];
    expect(computeOdometerM({ startingOdometerM: 0 }, rides)).toBe(30_000);
  });

  it('is unaffected by ride order (pure sum, not sequential state)', () => {
    const a = [{ distanceM: 1000 }, { distanceM: 2000 }];
    const b = [{ distanceM: 2000 }, { distanceM: 1000 }];
    expect(computeOdometerM({ startingOdometerM: 500 }, a)).toBe(
      computeOdometerM({ startingOdometerM: 500 }, b)
    );
  });
});
