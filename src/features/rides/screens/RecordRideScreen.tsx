import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { Button, Card, StatRow } from '../../../components';
import { speedKmh } from '../../../domain/gps-filter';
import { formatDistance, formatSpeed } from '../../../domain/units';
import type { ThemeColors } from '../../../theme/colors';
import { useTheme } from '../../../theme/useTheme';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatDuration } from '../format';
import { useRideRecorder, type RideSummary } from '../hooks/useRideRecorder';
import { useCreateRide } from '../hooks/useRides';

export default function RecordRideScreen() {
  const { t } = useTranslation();
  const { id: bikeId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    state,
    stats,
    start,
    pause,
    resume,
    stop,
    finalize,
    discard,
    autoPauseEnabled,
    setAutoPauseEnabled,
    isAutoPaused,
  } = useRideRecorder(bikeId);
  const createRide = useCreateRide();
  const { data: settings } = useSettings();
  const unitSystem = settings?.unitSystem ?? 'metric';

  const handleStart = async () => {
    const result = await start();
    if (result === 'foreground-denied') {
      Alert.alert(t('recordRide.locationPermissionTitle'), t('recordRide.locationPermissionMessage'));
    } else if (result === 'background-denied') {
      Alert.alert(t('recordRide.backgroundPermissionTitle'), t('recordRide.backgroundPermissionMessage'));
    }
  };

  const saveRide = async (summary: RideSummary) => {
    try {
      await createRide.mutateAsync({
        bikeId: summary.bikeId,
        startedAt: new Date(summary.startedAt),
        endedAt: new Date(summary.endedAt),
        distanceM: summary.distanceM,
        movingTimeMs: summary.movingTimeMs,
        pausedTimeMs: summary.pausedTimeMs,
        trackUri: summary.trackUri,
        elevationGainM: summary.elevationGainM,
      });
    } catch {
      // The track file and active-ride pointer are still on disk — nothing is lost yet.
      Alert.alert(t('recordRide.saveFailedTitle'), t('recordRide.saveFailedMessage'), [
        { text: t('common.retry'), onPress: () => void saveRide(summary) },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
      return;
    }

    // Only now is the ride safely in the database — clear the crash-recovery pointer. If this
    // cleanup itself fails, a stale pointer is recoverable noise, not data loss.
    await finalize().catch(() => {});

    Alert.alert(
      t('recordRide.rideCompleteTitle'),
      t('recordRide.rideCompleteMessage', {
        distance: formatDistance(summary.distanceM, unitSystem, 2),
        duration: formatDuration(summary.endedAt - summary.startedAt),
        speed: formatSpeed(speedKmh(summary.distanceM, summary.movingTimeMs), unitSystem),
      }),
      [{ text: t('common.ok'), onPress: () => router.back() }]
    );
  };

  const handleStop = async () => {
    const summary = await stop();
    if (!summary) return;
    await saveRide(summary);
  };

  const handleDiscard = () => {
    Alert.alert(t('recordRide.discardConfirmTitle'), t('recordRide.discardConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('recordRide.discard'),
        style: 'destructive',
        onPress: async () => {
          await discard();
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('recordRide.headerTitle') }} />

      <Card style={styles.card}>
        <StatRow size="lg" label={t('recordRide.distanceLabel')} value={formatDistance(stats.distanceM, unitSystem, 2)} />
        <StatRow size="lg" label={t('recordRide.durationLabel')} value={formatDuration(stats.durationMs)} />
        <StatRow size="lg" label={t('recordRide.currentSpeedLabel')} value={formatSpeed(stats.currentSpeedKmh, unitSystem)} />
        <StatRow size="lg" label={t('recordRide.avgSpeedLabel')} value={formatSpeed(stats.avgSpeedKmh, unitSystem)} />
      </Card>

      {state.status === 'idle' && (
        <>
          <View style={styles.autoPauseRow}>
            <View>
              <Text style={styles.autoPauseLabel}>{t('recordRide.autoPauseLabel')}</Text>
              <Text style={styles.autoPauseHint}>{t('recordRide.autoPauseHint')}</Text>
            </View>
            <Switch value={autoPauseEnabled} onValueChange={setAutoPauseEnabled} />
          </View>
          <Button title={t('recordRide.startRide')} onPress={handleStart} style={styles.button} />
        </>
      )}

      {state.status === 'recording' && (
        <>
          <Button title={t('recordRide.pause')} onPress={pause} disabled={createRide.isPending} style={styles.button} />
          <Button
            title={createRide.isPending ? t('common.saving') : t('recordRide.stop')}
            onPress={handleStop}
            variant="danger"
            disabled={createRide.isPending}
            style={styles.button}
          />
          <Button
            title={t('recordRide.discard')}
            onPress={handleDiscard}
            variant="ghostDanger"
            disabled={createRide.isPending}
            style={styles.button}
          />
        </>
      )}

      {state.status === 'paused' && (
        <>
          {isAutoPaused && <Text style={styles.autoPausedNotice}>{t('recordRide.autoPausedNotice')}</Text>}
          <Button title={t('recordRide.resume')} onPress={resume} disabled={createRide.isPending} style={styles.button} />
          <Button
            title={createRide.isPending ? t('common.saving') : t('recordRide.stop')}
            onPress={handleStop}
            variant="danger"
            disabled={createRide.isPending}
            style={styles.button}
          />
          <Button
            title={t('recordRide.discard')}
            onPress={handleDiscard}
            variant="ghostDanger"
            disabled={createRide.isPending}
            style={styles.button}
          />
        </>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: colors.background,
    },
    card: {
      marginBottom: 24,
    },
    button: {
      marginTop: 12,
    },
    autoPauseRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    autoPauseLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    autoPauseHint: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    autoPausedNotice: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: 4,
    },
  });
}
