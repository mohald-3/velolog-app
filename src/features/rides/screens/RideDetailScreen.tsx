import { Ionicons } from '@expo/vector-icons';
import { Camera, GeoJSONSource, Layer, Map } from '@maplibre/maplibre-react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { speedKmh } from '../../../domain/gps-filter';
import { formatDistance, formatSpeed } from '../../../domain/units';
import { readTrackPointsAsync } from '../../../../tasks/rideRecordingTask';
import i18n from '../../../i18n';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatDuration } from '../format';
import { useDeleteRide, useRide, useUpdateRide } from '../hooks/useRides';
import { buildTrackGeo, type TrackGeo } from '../trackGeo';

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export default function RideDetailScreen() {
  const { t } = useTranslation();
  const { rideId } = useLocalSearchParams<{ id: string; rideId: string }>();
  const router = useRouter();
  const { data: ride, isLoading } = useRide(rideId);
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const updateRide = useUpdateRide();
  const deleteRide = useDeleteRide();
  const insets = useSafeAreaInsets();

  const [trackGeo, setTrackGeo] = useState<TrackGeo | null>(null);
  const [notes, setNotes] = useState('');
  const [seededForRideId, setSeededForRideId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  if (isLoading || isLoadingSettings || !ride || !settings) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const unitSystem = settings.unitSystem;
  const durationMs = ride.endedAt.getTime() - ride.startedAt.getTime();
  const avgSpeedKmh = speedKmh(ride.distanceM, ride.movingTimeMs);

  const handleShare = async () => {
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert(t('rideDetail.sharingUnavailableTitle'), t('rideDetail.sharingUnavailableMessage', { uri: ride.trackUri }));
      return;
    }
    await Sharing.shareAsync(ride.trackUri);
  };

  const handleSaveNotes = () => {
    updateRide.mutate({ id: ride.id, changes: { notes: notes.trim() || null } });
  };

  const handleDelete = () => {
    setMenuOpen(false);
    Alert.alert(t('rideDetail.deleteConfirmTitle'), t('rideDetail.deleteConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteRide.mutateAsync({ id: ride.id, bikeId: ride.bikeId, distanceM: ride.distanceM });
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      <Stack.Screen
        options={{
          title: ride.startedAt.toLocaleDateString(i18n.language),
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable onPress={handleShare} hitSlop={12} style={styles.headerButton}>
                <Ionicons name="share-outline" size={22} color="#2f6f4f" />
              </Pressable>
              <Pressable onPress={() => setMenuOpen(true)} hitSlop={12} style={styles.headerButton}>
                <Ionicons name="ellipsis-vertical" size={22} color="#2f6f4f" />
              </Pressable>
            </View>
          ),
        }}
      />

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menu, { top: insets.top + 48 }]}>
            <Pressable style={styles.menuItem} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={18} color="#b00020" />
              <Text style={styles.menuItemText}>{t('rideDetail.deleteRide')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

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
              {trackGeo.status === 'empty' ? t('rideDetail.noTrack') : t('rideDetail.notEnoughPoints')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Stat label={t('rideDetail.distanceLabel')} value={formatDistance(ride.distanceM, unitSystem, 2)} />
        <Stat label={t('rideDetail.durationLabel')} value={formatDuration(durationMs)} />
        <Stat label={t('rideDetail.avgSpeedLabel')} value={formatSpeed(avgSpeedKmh, unitSystem)} />
        <Stat label={t('rideDetail.movingTimeLabel')} value={formatDuration(ride.movingTimeMs)} />
        <Stat label={t('rideDetail.pausedTimeLabel')} value={formatDuration(ride.pausedTimeMs)} />
      </View>

      <Text style={styles.label}>{t('common.notesLabel')}</Text>
      <TextInput
        style={styles.notesInput}
        multiline
        placeholder={t('rideDetail.notesPlaceholder')}
        value={notes}
        onChangeText={setNotes}
      />
      <Pressable style={styles.saveButton} onPress={handleSaveNotes}>
        <Text style={styles.saveButtonText}>{t('rideDetail.saveNotes')}</Text>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginRight: 16,
  },
  menuOverlay: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    right: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 4,
    minWidth: 160,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    marginLeft: 10,
    fontSize: 15,
    color: '#b00020',
    fontWeight: '600',
  },
});
