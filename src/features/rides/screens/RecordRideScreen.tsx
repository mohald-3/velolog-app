import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { speedKmh } from '../../../domain/gps-filter';
import { useRideRecorder } from '../hooks/useRideRecorder';
import { useCreateRide } from '../hooks/useRides';

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function RecordRideScreen() {
  const { id: bikeId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { state, stats, start, pause, resume, stop, discard } = useRideRecorder(bikeId);
  const createRide = useCreateRide();

  const handleStart = async () => {
    const result = await start();
    if (result === 'foreground-denied') {
      Alert.alert('Location permission needed', 'Allow location access to record a ride.');
    } else if (result === 'background-denied') {
      Alert.alert(
        'Background location needed',
        'Pick "Allow all the time" so tracking continues if you lock your phone mid-ride.'
      );
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
      'Ride complete',
      `Distance: ${(summary.distanceM / 1000).toFixed(2)} km\n` +
        `Duration: ${formatDuration(summary.endedAt - summary.startedAt)}\n` +
        `Avg speed: ${speedKmh(summary.distanceM, summary.movingTimeMs).toFixed(1)} km/h`,
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const handleDiscard = () => {
    Alert.alert('Discard this ride?', 'The recorded track will not be saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
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
      <Stack.Screen options={{ title: 'Record Ride' }} />

      <View style={styles.card}>
        <Stat label="Distance" value={`${(stats.distanceM / 1000).toFixed(2)} km`} />
        <Stat label="Duration" value={formatDuration(stats.durationMs)} />
        <Stat label="Current speed" value={`${stats.currentSpeedKmh.toFixed(1)} km/h`} />
        <Stat label="Avg speed" value={`${stats.avgSpeedKmh.toFixed(1)} km/h`} />
      </View>

      {state.status === 'idle' && (
        <Pressable style={styles.primaryButton} onPress={handleStart}>
          <Text style={styles.primaryButtonText}>Start Ride</Text>
        </Pressable>
      )}

      {state.status === 'recording' && (
        <>
          <Pressable style={styles.primaryButton} onPress={pause}>
            <Text style={styles.primaryButtonText}>Pause</Text>
          </Pressable>
          <Pressable style={styles.stopButton} onPress={handleStop}>
            <Text style={styles.stopButtonText}>Stop</Text>
          </Pressable>
          <Pressable style={styles.discardButton} onPress={handleDiscard}>
            <Text style={styles.discardButtonText}>Discard</Text>
          </Pressable>
        </>
      )}

      {state.status === 'paused' && (
        <>
          <Pressable style={styles.primaryButton} onPress={resume}>
            <Text style={styles.primaryButtonText}>Resume</Text>
          </Pressable>
          <Pressable style={styles.stopButton} onPress={handleStop}>
            <Text style={styles.stopButtonText}>Stop</Text>
          </Pressable>
          <Pressable style={styles.discardButton} onPress={handleDiscard}>
            <Text style={styles.discardButtonText}>Discard</Text>
          </Pressable>
        </>
      )}
    </View>
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
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  stat: {
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#2f6f4f',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  stopButton: {
    backgroundColor: '#b00020',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  stopButtonText: {
    color: '#ffffff',
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
    color: '#b00020',
    fontWeight: '600',
  },
});
