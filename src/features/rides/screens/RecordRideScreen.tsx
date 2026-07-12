import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { speedKmh } from '../../../domain/gps-filter';
import { formatDistance, formatSpeed } from '../../../domain/units';
import type { ThemeColors } from '../../../theme/colors';
import { useTheme } from '../../../theme/useTheme';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatDuration } from '../format';
import { useRideRecorder } from '../hooks/useRideRecorder';
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

  const handleStop = async () => {
    const summary = await stop();
    if (!summary) return;

    await createRide.mutateAsync({
      bikeId: summary.bikeId,
      startedAt: new Date(summary.startedAt),
      endedAt: new Date(summary.endedAt),
      distanceM: summary.distanceM,
      movingTimeMs: summary.movingTimeMs,
      pausedTimeMs: summary.pausedTimeMs,
      trackUri: summary.trackUri,
    });

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

      <View style={styles.card}>
        <Stat label={t('recordRide.distanceLabel')} value={formatDistance(stats.distanceM, unitSystem, 2)} styles={styles} />
        <Stat label={t('recordRide.durationLabel')} value={formatDuration(stats.durationMs)} styles={styles} />
        <Stat label={t('recordRide.currentSpeedLabel')} value={formatSpeed(stats.currentSpeedKmh, unitSystem)} styles={styles} />
        <Stat label={t('recordRide.avgSpeedLabel')} value={formatSpeed(stats.avgSpeedKmh, unitSystem)} styles={styles} />
      </View>

      {state.status === 'idle' && (
        <>
          <View style={styles.autoPauseRow}>
            <View>
              <Text style={styles.autoPauseLabel}>{t('recordRide.autoPauseLabel')}</Text>
              <Text style={styles.autoPauseHint}>{t('recordRide.autoPauseHint')}</Text>
            </View>
            <Switch value={autoPauseEnabled} onValueChange={setAutoPauseEnabled} />
          </View>
          <Pressable style={styles.primaryButton} onPress={handleStart}>
            <Text style={styles.primaryButtonText}>{t('recordRide.startRide')}</Text>
          </Pressable>
        </>
      )}

      {state.status === 'recording' && (
        <>
          <Pressable style={styles.primaryButton} onPress={pause}>
            <Text style={styles.primaryButtonText}>{t('recordRide.pause')}</Text>
          </Pressable>
          <Pressable style={styles.stopButton} onPress={handleStop}>
            <Text style={styles.stopButtonText}>{t('recordRide.stop')}</Text>
          </Pressable>
          <Pressable style={styles.discardButton} onPress={handleDiscard}>
            <Text style={styles.discardButtonText}>{t('recordRide.discard')}</Text>
          </Pressable>
        </>
      )}

      {state.status === 'paused' && (
        <>
          {isAutoPaused && <Text style={styles.autoPausedNotice}>{t('recordRide.autoPausedNotice')}</Text>}
          <Pressable style={styles.primaryButton} onPress={resume}>
            <Text style={styles.primaryButtonText}>{t('recordRide.resume')}</Text>
          </Pressable>
          <Pressable style={styles.stopButton} onPress={handleStop}>
            <Text style={styles.stopButtonText}>{t('recordRide.stop')}</Text>
          </Pressable>
          <Pressable style={styles.discardButton} onPress={handleDiscard}>
            <Text style={styles.discardButtonText}>{t('recordRide.discard')}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

function Stat({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
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
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    stat: {
      marginTop: 8,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 12,
    },
    primaryButtonText: {
      color: colors.onPrimary,
      fontWeight: '600',
      fontSize: 16,
    },
    stopButton: {
      backgroundColor: colors.danger,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 12,
    },
    stopButtonText: {
      color: colors.onPrimary,
      fontWeight: '600',
      fontSize: 16,
    },
    discardButton: {
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 12,
    },
    discardButtonText: {
      color: colors.danger,
      fontWeight: '600',
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
