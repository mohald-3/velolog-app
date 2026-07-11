import { Ionicons } from '@expo/vector-icons';
import { Camera, GeoJSONSource, Layer, Map } from '@maplibre/maplibre-react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { speedKmh } from '../../../domain/gps-filter';
import { readTrackPointsAsync } from '../../../../tasks/rideRecordingTask';
import { formatDuration } from '../format';
import { useRide, useUpdateRide } from '../hooks/useRides';
import { buildTrackGeo, type TrackGeo } from '../trackGeo';

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export default function RideDetailScreen() {
  const { rideId } = useLocalSearchParams<{ id: string; rideId: string }>();
  const { data: ride, isLoading } = useRide(rideId);
  const updateRide = useUpdateRide();
  const insets = useSafeAreaInsets();

  const [trackGeo, setTrackGeo] = useState<TrackGeo | null>(null);
  const [notes, setNotes] = useState('');
  const [seededForRideId, setSeededForRideId] = useState<string | null>(null);

  // Seed the editable notes field once per ride, without clobbering in-progress edits on
  // unrelated re-renders. Adjusting state during render (rather than in an effect) is the
  // documented pattern for this: https://react.dev/learn/you-might-not-need-an-effect
  if (ride && ride.id !== seededForRideId) {
    setSeededForRideId(ride.id);
    setNotes(ride.notes ?? '');
  }

  useEffect(() => {
    if (!ride) return;
    let cancelled = false;

    readTrackPointsAsync(ride.trackUri).then((points) => {
      if (!cancelled) setTrackGeo(buildTrackGeo(points));
    });

    return () => {
      cancelled = true;
    };
  }, [ride]);

  if (isLoading || !ride) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const durationMs = ride.endedAt.getTime() - ride.startedAt.getTime();
  const avgSpeedKmh = speedKmh(ride.distanceM, ride.movingTimeMs);

  const handleShare = async () => {
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert('Sharing unavailable', `Track file is at: ${ride.trackUri}`);
      return;
    }
    await Sharing.shareAsync(ride.trackUri);
  };

  const handleSaveNotes = () => {
    updateRide.mutate({ id: ride.id, changes: { notes: notes.trim() || null } });
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      <Stack.Screen
        options={{
          title: ride.startedAt.toLocaleDateString(),
          headerRight: () => (
            <Pressable onPress={handleShare} hitSlop={12} style={styles.headerShareButton}>
              <Ionicons name="share-outline" size={22} color="#2f6f4f" />
            </Pressable>
          ),
        }}
      />

      <View style={styles.mapContainer}>
        {!trackGeo ? (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="large" />
          </View>
        ) : trackGeo.status === 'ready' ? (
          <Map style={styles.map} mapStyle={MAP_STYLE_URL}>
            <Camera initialViewState={{ bounds: trackGeo.bounds, padding: { top: 40, right: 40, bottom: 40, left: 40 } }} />
            <GeoJSONSource id="ride-track" data={trackGeo.geojson}>
              <Layer
                id="ride-track-line"
                type="line"
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={{ 'line-color': '#2f6f4f', 'line-width': 4 }}
              />
            </GeoJSONSource>
          </Map>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>
              {trackGeo.status === 'empty' ? 'No track recorded for this ride.' : 'Not enough points to draw a track.'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Stat label="Distance" value={`${(ride.distanceM / 1000).toFixed(2)} km`} />
        <Stat label="Duration" value={formatDuration(durationMs)} />
        <Stat label="Avg speed" value={`${avgSpeedKmh.toFixed(1)} km/h`} />
        <Stat label="Moving time" value={formatDuration(ride.movingTimeMs)} />
        <Stat label="Paused time" value={formatDuration(ride.pausedTimeMs)} />
      </View>

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={styles.notesInput}
        multiline
        placeholder="Add a note about this ride..."
        value={notes}
        onChangeText={setNotes}
      />
      <Pressable style={styles.saveButton} onPress={handleSaveNotes}>
        <Text style={styles.saveButtonText}>Save notes</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  mapContainer: {
    height: 260,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f2f2',
    padding: 20,
  },
  mapPlaceholderText: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    padding: 16,
  },
  stat: {
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    color: '#888888',
    marginTop: 20,
    marginBottom: 6,
  },
  notesInput: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: '#f2f2f2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#2f6f4f',
    fontWeight: '600',
  },
  headerShareButton: {
    marginRight: 12,
  },
});
