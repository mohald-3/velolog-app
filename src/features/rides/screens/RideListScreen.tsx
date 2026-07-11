import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { speedKmh } from '../../../domain/gps-filter';
import { groupRidesByDay } from '../../../domain/stats';
import type { Ride } from '../../../domain/types';
import { formatDuration } from '../format';
import { useRides } from '../hooks/useRides';

function formatDayHeader(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function RideListScreen() {
  const { id: bikeId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: rides, isLoading } = useRides(bikeId);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const groups = groupRidesByDay(rides ?? []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Rides' }} />
      {groups.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No rides recorded yet.</Text>
        </View>
      ) : (
        <SectionList
          contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}
          sections={groups.map((g) => ({ title: g.dateKey, data: g.rides }))}
          keyExtractor={(ride: Ride) => ride.id}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{formatDayHeader(section.title)}</Text>
          )}
          renderItem={({ item: ride }) => (
            <RideRow ride={ride} onPress={() => router.push(`/bikes/${bikeId}/rides/${ride.id}`)} />
          )}
        />
      )}
    </View>
  );
}

function RideRow({ ride, onPress }: { ride: Ride; onPress: () => void }) {
  const durationMs = ride.endedAt.getTime() - ride.startedAt.getTime();
  const avgSpeedKmh = speedKmh(ride.distanceM, ride.movingTimeMs);

  return (
    <Pressable style={styles.rideRow} onPress={onPress}>
      <View>
        <Text style={styles.rideDistance}>{(ride.distanceM / 1000).toFixed(2)} km</Text>
        <Text style={styles.rideMeta}>
          {formatDuration(durationMs)} · {avgSpeedKmh.toFixed(1)} km/h avg
        </Text>
      </View>
      <Text style={styles.rideTime}>
        {ride.startedAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888888',
    marginTop: 16,
    marginBottom: 8,
  },
  rideRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
  },
  rideDistance: {
    fontSize: 17,
    fontWeight: '700',
  },
  rideMeta: {
    fontSize: 13,
    color: '#888888',
    marginTop: 2,
  },
  rideTime: {
    fontSize: 13,
    color: '#888888',
  },
});
