import { Ionicons } from '@expo/vector-icons';
import { Camera, GeoJSONSource, Layer, Map } from '@maplibre/maplibre-react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, FormField, LoadingState, OverflowMenu, StatRow } from '../../../components';
import { speedKmh } from '../../../domain/gps-filter';
import { formatDistance, formatElevation, formatSpeed } from '../../../domain/units';
import { readTrackPointsAsync } from '../../../services/rideRecordingTask';
import i18n from '../../../i18n';
import { useSettings } from '../../settings/hooks/useSettings';
import { type ThemeColors } from '../../../theme/colors';
import { useTheme } from '../../../theme/useTheme';
import { formatDuration } from '../format';
import { useRideExport } from '../hooks/useRideExport';
import { useDeleteRide, useRecomputeRideElevation, useRide, useUpdateRide } from '../hooks/useRides';
import { buildTrackGeo, type TrackGeo } from '../trackGeo';

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export default function RideDetailScreen() {
  const { t } = useTranslation();
  const { rideId } = useLocalSearchParams<{ id: string; rideId: string }>();
  const router = useRouter();
  const { data: ride, isLoading } = useRide(rideId);
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const updateRide = useUpdateRide();
  const recomputeElevation = useRecomputeRideElevation();
  const deleteRide = useDeleteRide();
  const exportRide = useRideExport();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
    return <LoadingState />;
  }

  const unitSystem = settings.unitSystem;
  const durationMs = ride.endedAt.getTime() - ride.startedAt.getTime();
  const avgSpeedKmh = speedKmh(ride.distanceM, ride.movingTimeMs);

  const handleSaveNotes = () => {
    updateRide.mutate({ id: ride.id, changes: { notes: notes.trim() || null } });
  };

  const handleDelete = () => {
    Alert.alert(t('rideDetail.deleteConfirmTitle'), t('rideDetail.deleteConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () =>
          deleteRide.mutate(
            { id: ride.id, bikeId: ride.bikeId, distanceM: ride.distanceM },
            { onSuccess: () => router.back() }
          ),
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
              <Pressable onPress={() => setMenuOpen(true)} hitSlop={12} style={styles.headerButton}>
                <Ionicons name="ellipsis-vertical" size={22} color={colors.primary} />
              </Pressable>
            </View>
          ),
        }}
      />

      <OverflowMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={[
          {
            label: exportRide.isPending ? t('rideDetail.exportingGpx') : t('rideDetail.exportGpx'),
            icon: 'share-outline',
            disabled: exportRide.isPending,
            onPress: () => exportRide.mutate({ ride, dialogTitle: t('rideDetail.exportGpx') }),
          },
          ...(ride.elevationGainM == null
            ? [
                {
                  label: recomputeElevation.isPending
                    ? t('rideDetail.calculatingElevation')
                    : t('rideDetail.calculateElevation'),
                  icon: 'trending-up-outline' as const,
                  disabled: recomputeElevation.isPending,
                  onPress: () =>
                    recomputeElevation.mutate({ id: ride.id, trackUri: ride.trackUri }),
                },
              ]
            : []),
          {
            label: t('rideDetail.deleteRide'),
            icon: 'trash-outline',
            destructive: true,
            onPress: handleDelete,
          },
        ]}
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
                paint={{ 'line-color': colors.primary, 'line-width': 4 }}
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

      <Card>
        <StatRow label={t('rideDetail.distanceLabel')} value={formatDistance(ride.distanceM, unitSystem, 2)} />
        <StatRow label={t('rideDetail.durationLabel')} value={formatDuration(durationMs)} />
        <StatRow label={t('rideDetail.avgSpeedLabel')} value={formatSpeed(avgSpeedKmh, unitSystem)} />
        <StatRow label={t('rideDetail.movingTimeLabel')} value={formatDuration(ride.movingTimeMs)} />
        <StatRow label={t('rideDetail.pausedTimeLabel')} value={formatDuration(ride.pausedTimeMs)} />
        <StatRow
          label={t('rideDetail.elevationGainLabel')}
          value={
            ride.elevationGainM == null
              ? t('rideDetail.elevationUnavailable')
              : formatElevation(ride.elevationGainM, unitSystem)
          }
        />
      </Card>

      <FormField
        label={t('common.notesLabel')}
        value={notes}
        onChangeText={setNotes}
        placeholder={t('rideDetail.notesPlaceholder')}
        multiline
        style={styles.notesField}
      />
      <Button
        title={t('rideDetail.saveNotes')}
        onPress={handleSaveNotes}
        variant="secondary"
        style={styles.saveButton}
      />
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
      backgroundColor: colors.surface,
      padding: 20,
    },
    mapPlaceholderText: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
    },
    notesField: {
      marginTop: 20,
      marginBottom: 0,
    },
    saveButton: {
      marginTop: 12,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerButton: {
      marginRight: 16,
    },
  });
}
