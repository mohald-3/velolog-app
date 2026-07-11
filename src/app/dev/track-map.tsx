import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Camera, GeoJSONSource, Layer, Map, type LngLatBounds } from '@maplibre/maplibre-react-native';

import { TRACK_LOG_URI } from '../../../tasks/locationTask';

export const options = { title: 'Recorded Track' };

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

const MIN_BOUNDS_SPAN_DEG = 0.0005; // ~50m; a zero-area box crashes MapLibre's native camera

function padDegenerateBounds([minLon, minLat, maxLon, maxLat]: LngLatBounds): LngLatBounds {
  const lonPad = maxLon - minLon < MIN_BOUNDS_SPAN_DEG ? MIN_BOUNDS_SPAN_DEG / 2 : 0;
  const latPad = maxLat - minLat < MIN_BOUNDS_SPAN_DEG ? MIN_BOUNDS_SPAN_DEG / 2 : 0;
  return [minLon - lonPad, minLat - latPad, maxLon + lonPad, maxLat + latPad];
}

function dedupeConsecutive(coordinates: [number, number][]): [number, number][] {
  return coordinates.filter((c, i) => i === 0 || c[0] !== coordinates[i - 1][0] || c[1] !== coordinates[i - 1][1]);
}

type TrackState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'single-point'; point: [number, number] }
  | { status: 'ready'; geojson: GeoJSON.Feature<GeoJSON.LineString>; bounds: LngLatBounds }
  | { status: 'error'; message: string };

export default function TrackMapScreen() {
  const [state, setState] = useState<TrackState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const info = await FileSystem.getInfoAsync(TRACK_LOG_URI);
        if (!info.exists) {
          if (!cancelled) setState({ status: 'empty' });
          return;
        }

        const content = await FileSystem.readAsStringAsync(TRACK_LOG_URI);
        const points = content
          .split('\n')
          .filter(Boolean)
          .map((line) => JSON.parse(line) as { lat: number; lon: number });

        if (points.length === 0) {
          if (!cancelled) setState({ status: 'empty' });
          return;
        }

        const coordinates = dedupeConsecutive(points.map((p): [number, number] => [p.lon, p.lat]));

        if (coordinates.length < 2) {
          if (!cancelled) setState({ status: 'single-point', point: coordinates[0] });
          return;
        }

        const lons = coordinates.map((c) => c[0]);
        const lats = coordinates.map((c) => c[1]);
        const bounds = padDegenerateBounds([
          Math.min(...lons),
          Math.min(...lats),
          Math.max(...lons),
          Math.max(...lats),
        ]);

        if (!cancelled) {
          setState({
            status: 'ready',
            geojson: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } },
            bounds,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'loading') {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (state.status === 'empty') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.message}>No recorded track found at {TRACK_LOG_URI}.</Text>
      </SafeAreaView>
    );
  }

  if (state.status === 'single-point') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.message}>
          Only one distinct point recorded so far ({state.point[1].toFixed(5)}, {state.point[0].toFixed(5)}).
          Keep moving to record a track.
        </Text>
      </SafeAreaView>
    );
  }

  if (state.status === 'error') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.message}>Failed to load track: {state.message}</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Map style={styles.map} mapStyle={MAP_STYLE_URL}>
        <Camera initialViewState={{ bounds: state.bounds, padding: { top: 40, right: 40, bottom: 40, left: 40 } }} />
        <GeoJSONSource id="recorded-track" data={state.geojson}>
          <Layer
            id="recorded-track-line"
            type="line"
            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
            paint={{ 'line-color': '#2f6f4f', 'line-width': 4 }}
          />
        </GeoJSONSource>
      </Map>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  message: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});
