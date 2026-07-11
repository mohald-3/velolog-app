import type { LngLatBounds } from '@maplibre/maplibre-react-native';

import type { RawGpsPoint } from '../../domain/gps-filter';

// ~50m; a zero-area box crashes MapLibre's native camera (found rendering a real recorded
// track with only one distinct point — see src/app/dev/track-map.tsx).
const MIN_BOUNDS_SPAN_DEG = 0.0005;

export function padDegenerateBounds([minLon, minLat, maxLon, maxLat]: LngLatBounds): LngLatBounds {
  const lonPad = maxLon - minLon < MIN_BOUNDS_SPAN_DEG ? MIN_BOUNDS_SPAN_DEG / 2 : 0;
  const latPad = maxLat - minLat < MIN_BOUNDS_SPAN_DEG ? MIN_BOUNDS_SPAN_DEG / 2 : 0;
  return [minLon - lonPad, minLat - latPad, maxLon + lonPad, maxLat + latPad];
}

function dedupeConsecutive(coordinates: [number, number][]): [number, number][] {
  return coordinates.filter((c, i) => i === 0 || c[0] !== coordinates[i - 1][0] || c[1] !== coordinates[i - 1][1]);
}

export type TrackGeo =
  | { status: 'empty' }
  | { status: 'single-point'; point: [number, number] }
  | { status: 'ready'; geojson: GeoJSON.Feature<GeoJSON.LineString>; bounds: LngLatBounds };

/** Turns raw recorded points into map-ready geometry, guarding against the degenerate cases
 * (no points, or fewer than 2 distinct points) that can crash MapLibre's native renderer. */
export function buildTrackGeo(points: RawGpsPoint[]): TrackGeo {
  if (points.length === 0) return { status: 'empty' };

  const coordinates = dedupeConsecutive(points.map((p): [number, number] => [p.lon, p.lat]));
  if (coordinates.length < 2) {
    return { status: 'single-point', point: coordinates[0] };
  }

  const lons = coordinates.map((c) => c[0]);
  const lats = coordinates.map((c) => c[1]);
  const bounds = padDegenerateBounds([Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)]);

  return {
    status: 'ready',
    geojson: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } },
    bounds,
  };
}
