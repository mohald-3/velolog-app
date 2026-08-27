import { Camera, GeoJSONSource, Layer, Map } from '@maplibre/maplibre-react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, FormField, LoadingState, StatRow } from '../../../components';
import { summarizeGpxImport, type GpxImportSummary } from '../../../domain/gpx-import';
import { formatDistance, formatElevation } from '../../../domain/units';
import { pickGpxImportAsync, type GpxImportDraft } from '../../../services/gpxImport';
import type { ThemeColors } from '../../../theme/colors';
import { useTheme } from '../../../theme/useTheme';
import { useBikes } from '../../bikes/hooks/useBikes';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatDuration } from '../format';
import { buildTrackGeo } from '../trackGeo';
import { useSaveGpxImport } from '../hooks/useRideImport';
import i18n from '../../../i18n';

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export default function ImportRideScreen() {
  const { t } = useTranslation();
  const { id: initialBikeId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: bikes, isLoading: bikesLoading } = useBikes();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const saveImport = useSaveGpxImport();
  const savingRef = useRef(false);
  const [bikeId, setBikeId] = useState(initialBikeId);
  const [draft, setDraft] = useState<GpxImportDraft | null>(null);
  const [summary, setSummary] = useState<GpxImportSummary | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [durationMinutes, setDurationMinutes] = useState('60');

  if (bikesLoading || settingsLoading || !settings) return <LoadingState />;

  const chooseFile = async () => {
    try {
      const selected = await pickGpxImportAsync();
      if (!selected) return;
      setDraft(selected);
      try {
        setSummary(summarizeGpxImport(selected.gpx));
      } catch (error) {
        if (error instanceof Error && error.message.includes('fallback')) setSummary(null);
        else throw error;
      }
    } catch {
      Alert.alert(t('rideImport.invalidTitle'), t('rideImport.invalidMessage'));
    }
  };

  const applyFallback = () => {
    if (!draft) return;
    const startedAt = new Date(`${date}T12:00:00`);
    const durationMs = Number(durationMinutes) * 60_000;
    try {
      setSummary(summarizeGpxImport(draft.gpx, { startedAt, durationMs }));
    } catch {
      Alert.alert(t('rideImport.invalidTimeTitle'), t('rideImport.invalidTimeMessage'));
    }
  };

  const save = () => {
    if (!summary || !bikeId || savingRef.current) return;
    savingRef.current = true;
    saveImport.mutate(
      { bikeId, summary },
      {
        onSuccess: (ride) => router.replace(`/bikes/${bikeId}/rides/${ride.id}`),
        onSettled: () => { savingRef.current = false; },
      }
    );
  };

  const trackGeo = summary ? buildTrackGeo(summary.points) : null;
  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      <Stack.Screen options={{ title: t('rideImport.headerTitle') }} />
      <Button title={draft ? t('rideImport.chooseAnother') : t('rideImport.chooseFile')} onPress={chooseFile} />
      {draft && <Text style={styles.filename}>{draft.filename}</Text>}

      {draft && !summary && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('rideImport.missingTimeTitle')}</Text>
          <FormField label={t('rideImport.dateLabel')} value={date} onChangeText={setDate} />
          <FormField label={t('rideImport.durationMinutesLabel')} value={durationMinutes} onChangeText={setDurationMinutes} keyboardType="number-pad" />
          <Button title={t('rideImport.applyTime')} onPress={applyFallback} variant="secondary" />
        </Card>
      )}

      {summary && (
        <>
          {trackGeo?.status === 'ready' && (
            <View style={styles.mapContainer}>
              <Map style={styles.map} mapStyle={MAP_STYLE_URL}>
                <Camera initialViewState={{ bounds: trackGeo.bounds, padding: { top: 30, right: 30, bottom: 30, left: 30 } }} />
                <GeoJSONSource id="import-track" data={trackGeo.geojson}>
                  <Layer id="import-line" type="line" paint={{ 'line-color': colors.primary, 'line-width': 4 }} />
                </GeoJSONSource>
              </Map>
            </View>
          )}
          <Card style={styles.section}>
            <StatRow label={t('rideDetail.distanceLabel')} value={formatDistance(summary.distanceM, settings.unitSystem, 2)} />
            <StatRow label={t('rideDetail.durationLabel')} value={formatDuration(summary.endedAt.getTime() - summary.startedAt.getTime())} />
            <StatRow label={t('rideImport.dateLabel')} value={summary.startedAt.toLocaleString(i18n.language)} />
            <StatRow label={t('rideDetail.elevationGainLabel')} value={summary.elevationGainM == null ? t('rideDetail.elevationUnavailable') : formatElevation(summary.elevationGainM, settings.unitSystem)} />
          </Card>
          <Text style={styles.sectionTitle}>{t('rideImport.bikeLabel')}</Text>
          {(bikes ?? []).map((bike) => (
            <Pressable key={bike.id} style={[styles.bike, bikeId === bike.id && styles.bikeSelected]} onPress={() => setBikeId(bike.id)}>
              <Text style={styles.bikeText}>{bike.name}</Text>
            </Pressable>
          ))}
          <Button title={saveImport.isPending ? t('common.saving') : t('rideImport.saveRide')} onPress={save} disabled={saveImport.isPending || !bikeId} style={styles.save} />
        </>
      )}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { padding: 20, backgroundColor: colors.background },
    filename: { color: colors.textMuted, marginTop: 8, textAlign: 'center' },
    section: { marginTop: 20 },
    sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 8 },
    mapContainer: { height: 240, borderRadius: 12, overflow: 'hidden', marginTop: 20 },
    map: { flex: 1 },
    bike: { padding: 14, borderRadius: 8, backgroundColor: colors.surface, marginBottom: 8, borderWidth: 1, borderColor: colors.surfaceBorder },
    bikeSelected: { borderColor: colors.primary, borderWidth: 2 },
    bikeText: { color: colors.text, fontSize: 15, fontWeight: '600' },
    save: { marginTop: 16 },
  });
}
