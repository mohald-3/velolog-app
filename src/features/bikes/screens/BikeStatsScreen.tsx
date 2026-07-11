import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { computeBikeStats } from '../../../domain/stats';
import { formatDuration } from '../../rides/format';
import { useRides } from '../../rides/hooks/useRides';
import { useBike } from '../hooks/useBikes';

export default function BikeStatsScreen() {
  const { id: bikeId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: bike, isLoading: isLoadingBike } = useBike(bikeId);
  const { data: rides, isLoading: isLoadingRides } = useRides(bikeId);

  if (isLoadingBike || isLoadingRides) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const stats = computeBikeStats(rides ?? []);

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      <Stack.Screen options={{ title: bike ? `${bike.name} — Stats` : 'Stats' }} />

      {stats.rideCount === 0 ? (
        <Text style={styles.emptyText}>No rides recorded yet.</Text>
      ) : (
        <View style={styles.card}>
          <Stat label="Total rides" value={String(stats.rideCount)} />
          <Stat label="Total distance" value={`${(stats.totalDistanceM / 1000).toFixed(1)} km`} />
          <Stat label="Total time" value={formatDuration(stats.totalTimeMs)} />
          <Stat label="Longest ride" value={`${(stats.longestRideM / 1000).toFixed(2)} km`} />
          <Stat label="Average ride" value={`${(stats.averageRideM / 1000).toFixed(2)} km`} />
        </View>
      )}
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
  emptyText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginTop: 20,
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
});
