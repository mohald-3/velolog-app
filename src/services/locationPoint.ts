import type * as Location from 'expo-location';

import type { RawGpsPoint } from '../domain/gps-filter';

/** Maps Expo's platform location shape into VeloLog's backward-compatible track contract. */
export function locationToRawGpsPoint(location: Location.LocationObject): RawGpsPoint {
  return {
    ts: location.timestamp,
    lat: location.coords.latitude,
    lon: location.coords.longitude,
    accuracyM: location.coords.accuracy,
    altitudeM: location.coords.altitude,
    verticalAccuracyM: location.coords.altitudeAccuracy,
  };
}
