import type * as Location from 'expo-location';

import { locationToRawGpsPoint } from './locationPoint';

function location(overrides?: Partial<Location.LocationObject['coords']>): Location.LocationObject {
  return {
    timestamp: 1_777_777,
    coords: {
      latitude: 59.3293,
      longitude: 18.0686,
      altitude: 42.5,
      accuracy: 4,
      altitudeAccuracy: 7,
      heading: null,
      speed: null,
      ...overrides,
    },
  };
}

describe('locationToRawGpsPoint', () => {
  it('captures altitude and vertical accuracy alongside the existing fields', () => {
    expect(locationToRawGpsPoint(location())).toEqual({
      ts: 1_777_777,
      lat: 59.3293,
      lon: 18.0686,
      accuracyM: 4,
      altitudeM: 42.5,
      verticalAccuracyM: 7,
    });
  });

  it('preserves null altitude values reported by the platform', () => {
    expect(
      locationToRawGpsPoint(location({ altitude: null, altitudeAccuracy: null }))
    ).toMatchObject({ altitudeM: null, verticalAccuracyM: null });
  });
});
