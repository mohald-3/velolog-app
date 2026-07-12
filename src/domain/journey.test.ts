import { computeJourneyStats, computeMilestoneProgress } from './journey';
import type { Bike, MaintenanceRecord, Ride } from './types';

function makeBike(overrides: Partial<Bike> = {}): Bike {
  return {
    id: 'bike-1',
    name: 'Test Bike',
    brand: null,
    model: null,
    year: null,
    color: null,
    frameSize: null,
    purchaseDate: null,
    purchasePrice: null,
    currency: null,
    photoUri: null,
    notes: null,
    startingOdometerM: 0,
    isDefault: false,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeRide(overrides: Partial<Ride> = {}): Ride {
  return {
    id: 'ride-1',
    bikeId: 'bike-1',
    startedAt: new Date(),
    endedAt: new Date(),
    distanceM: 0,
    movingTimeMs: 0,
    pausedTimeMs: 0,
    trackUri: 'file://track',
    notes: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeRecord(overrides: Partial<MaintenanceRecord> = {}): MaintenanceRecord {
  return {
    id: 'record-1',
    componentId: 'component-1',
    ruleId: null,
    action: 'Lubricate chain',
    performedAtOdometerM: 0,
    performedDate: new Date(),
    cost: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('computeMilestoneProgress', () => {
  it('marks a milestone reached once total distance meets or exceeds it', () => {
    const progress = computeMilestoneProgress(71_000);
    const uppsala = progress.find((m) => m.id === 'stockholmUppsala');
    expect(uppsala?.reached).toBe(true);
    expect(uppsala?.remainingM).toBe(0);
  });

  it('reports remaining meters for an unreached milestone', () => {
    const progress = computeMilestoneProgress(50_000);
    const uppsala = progress.find((m) => m.id === 'stockholmUppsala');
    expect(uppsala?.reached).toBe(false);
    expect(uppsala?.remainingM).toBe(21_000);
  });

  it('returns milestones in ascending distance order', () => {
    const progress = computeMilestoneProgress(0);
    const distances = progress.map((m) => m.distanceM);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });

  it('marks nothing reached at zero distance', () => {
    const progress = computeMilestoneProgress(0);
    expect(progress.every((m) => !m.reached)).toBe(true);
  });
});

describe('computeJourneyStats', () => {
  it('returns all-zero stats for an empty garage', () => {
    const stats = computeJourneyStats([], [], []);
    expect(stats.totalDistanceM).toBe(0);
    expect(stats.totalRideCount).toBe(0);
    expect(stats.totalCost).toBe(0);
    expect(stats.co2SavedKg).toBe(0);
    expect(stats.caloriesBurned).toBe(0);
    expect(stats.milestones.every((m) => !m.reached)).toBe(true);
  });

  it('sums ride distance across multiple bikes', () => {
    const stats = computeJourneyStats(
      [makeBike({ id: 'a' }), makeBike({ id: 'b' })],
      [makeRide({ bikeId: 'a', distanceM: 10_000 }), makeRide({ bikeId: 'b', distanceM: 5_000 })],
      []
    );
    expect(stats.totalDistanceM).toBe(15_000);
    expect(stats.totalRideCount).toBe(2);
  });

  it('sums bike purchase price and maintenance record cost into totalCost', () => {
    const stats = computeJourneyStats(
      [makeBike({ purchasePrice: 5000 }), makeBike({ id: 'bike-2', purchasePrice: 1200 })],
      [],
      [makeRecord({ cost: 150 }), makeRecord({ cost: null })]
    );
    expect(stats.totalCost).toBe(5000 + 1200 + 150);
  });

  it('derives co2 saved and calories from total distance', () => {
    const stats = computeJourneyStats([], [makeRide({ distanceM: 10_000 })], []);
    expect(stats.co2SavedKg).toBeCloseTo(2.51, 5);
    expect(stats.caloriesBurned).toBeCloseTo(350, 5);
  });

  it('includes archived bikes so a retired bike still counts toward total cost', () => {
    const stats = computeJourneyStats([makeBike({ isArchived: true, purchasePrice: 800 })], [], []);
    expect(stats.totalCost).toBe(800);
  });
});
