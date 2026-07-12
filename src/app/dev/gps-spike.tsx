import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import * as Sharing from 'expo-sharing';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Button, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  TRACK_LOG_URI,
  clearLogAsync,
  readLogStatsAsync,
  startTrackingAsync,
  stopTrackingAsync,
} from '../../services/locationTask';

export const options = { title: 'GPS Spike Test' };

export default function GpsSpikeScreen() {
  const [tracking, setTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [stats, setStats] = useState({ pointCount: 0, sizeBytes: 0 });

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      const next = await readLogStatsAsync();
      if (!cancelled) setStats(next);
    }

    tick();
    const id = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const refreshStats = async () => {
    setStats(await readLogStatsAsync());
  };

  const requestPermissions = async (): Promise<boolean> => {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') {
      setPermissionStatus('foreground denied');
      Alert.alert('Permission needed', 'Foreground location is required to track a ride.');
      return false;
    }

    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== 'granted') {
      setPermissionStatus('background denied');
      Alert.alert(
        'Background location needed',
        'Pick "Allow all the time" in the system dialog so tracking continues with the screen off.'
      );
      return false;
    }

    setPermissionStatus('granted');
    return true;
  };

  const handleStart = async () => {
    const ok = await requestPermissions();
    if (!ok) return;
    await startTrackingAsync();
    setTracking(true);
  };

  const handleStop = async () => {
    await stopTrackingAsync();
    setTracking(false);
    refreshStats();
  };

  const handleShare = async () => {
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert('Sharing unavailable', `Log file is at: ${TRACK_LOG_URI}`);
      return;
    }
    await Sharing.shareAsync(TRACK_LOG_URI);
  };

  const handleClear = async () => {
    await stopTrackingAsync();
    setTracking(false);
    await clearLogAsync();
    refreshStats();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>VeloLog — Spike 0</Text>
        <Text style={styles.subtitle}>GPS de-risk: background tracking test</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{tracking ? 'Recording' : 'Idle'}</Text>

          <Text style={styles.label}>Permission</Text>
          <Text style={styles.value}>{permissionStatus}</Text>

          <Text style={styles.label}>Points logged</Text>
          <Text style={styles.value}>{stats.pointCount}</Text>

          <Text style={styles.label}>Log file size</Text>
          <Text style={styles.value}>{(stats.sizeBytes / 1024).toFixed(1)} KB</Text>
        </View>

        <View style={styles.buttonRow}>
          {!tracking ? (
            <Button title="Start tracking" onPress={handleStart} />
          ) : (
            <Button title="Stop tracking" color="#b00020" onPress={handleStop} />
          )}
        </View>
        <View style={styles.buttonRow}>
          <Button title="Share log file" onPress={handleShare} />
        </View>
        <View style={styles.buttonRow}>
          <Button title="Clear log" color="#666666" onPress={handleClear} />
        </View>
        <View style={styles.buttonRow}>
          <Link href="/dev/track-map" asChild>
            <Button title="View recorded track on map" />
          </Link>
        </View>

        <Text style={styles.hint}>
          Start tracking, lock the phone, and go ride. Points are appended to disk as they
          arrive, so the log survives the app being killed. Use &ldquo;Share log file&rdquo;
          afterwards to pull the NDJSON off the device for analysis.
        </Text>
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    padding: 16,
  },
  label: {
    fontSize: 12,
    color: '#888888',
    marginTop: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
  },
  buttonRow: {
    marginTop: 12,
  },
  hint: {
    marginTop: 16,
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
});
