import {
  convertSpeed,
  distanceUnitLabel,
  distanceUnitToMeters,
  formatDistance,
  formatDistanceInput,
  formatSpeed,
  metersToDistanceUnit,
  metersToKm,
  metersToMiles,
  speedUnitLabel,
} from './units';

describe('metersToKm', () => {
  it('converts meters to kilometers', () => {
    expect(metersToKm(1000)).toBe(1);
    expect(metersToKm(2500)).toBe(2.5);
  });
});

describe('metersToMiles', () => {
  it('converts meters to miles', () => {
    expect(metersToMiles(1609.344)).toBeCloseTo(1, 5);
  });
});

describe('metersToDistanceUnit', () => {
  it('uses km for metric', () => {
    expect(metersToDistanceUnit(1000, 'metric')).toBe(1);
  });

  it('uses miles for imperial', () => {
    expect(metersToDistanceUnit(1609.344, 'imperial')).toBeCloseTo(1, 5);
  });
});

describe('formatDistanceInput', () => {
  it('rounds metric display values to at most two decimal places', () => {
    expect(formatDistanceInput(220.11187862751427, 'metric')).toBe('0.22');
    expect(formatDistanceInput(12_000, 'metric')).toBe('12');
  });

  it('rounds imperial display values to at most two decimal places', () => {
    expect(formatDistanceInput(5_000, 'imperial')).toBe('3.11');
  });
});

describe('distanceUnitLabel', () => {
  it('returns km for metric and mi for imperial', () => {
    expect(distanceUnitLabel('metric')).toBe('km');
    expect(distanceUnitLabel('imperial')).toBe('mi');
  });
});

describe('formatDistance', () => {
  it('formats metric distance with the km suffix', () => {
    expect(formatDistance(12345, 'metric')).toBe('12.3 km');
  });

  it('formats imperial distance with the mi suffix', () => {
    expect(formatDistance(1609.344, 'imperial')).toBe('1.0 mi');
  });

  it('respects a custom fraction digit count', () => {
    expect(formatDistance(1234, 'metric', 2)).toBe('1.23 km');
  });
});

describe('distanceUnitToMeters', () => {
  it('treats the value as km for metric', () => {
    expect(distanceUnitToMeters(1, 'metric')).toBe(1000);
  });

  it('treats the value as miles for imperial', () => {
    expect(distanceUnitToMeters(1, 'imperial')).toBeCloseTo(1609.344, 5);
  });

  it('round-trips with metersToDistanceUnit', () => {
    expect(distanceUnitToMeters(metersToDistanceUnit(5000, 'imperial'), 'imperial')).toBeCloseTo(5000, 5);
  });
});

describe('convertSpeed', () => {
  it('passes through km/h unchanged for metric', () => {
    expect(convertSpeed(20, 'metric')).toBe(20);
  });

  it('converts km/h to mph for imperial', () => {
    expect(convertSpeed(1.609344, 'imperial')).toBeCloseTo(1, 5);
  });
});

describe('speedUnitLabel', () => {
  it('returns km/h for metric and mph for imperial', () => {
    expect(speedUnitLabel('metric')).toBe('km/h');
    expect(speedUnitLabel('imperial')).toBe('mph');
  });
});

describe('formatSpeed', () => {
  it('formats metric speed with the km/h suffix', () => {
    expect(formatSpeed(18.5, 'metric')).toBe('18.5 km/h');
  });

  it('formats imperial speed with the mph suffix', () => {
    expect(formatSpeed(16.09344, 'imperial')).toBe('10.0 mph');
  });
});
