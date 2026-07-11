import { Link, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Bike } from '../../../domain/types';
import { useBikes } from '../hooks/useBikes';

export default function BikeListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: bikes, isLoading } = useBikes();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!bikes || bikes.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No bikes yet</Text>
        <Text style={styles.emptySubtitle}>Add your first bike to start tracking it.</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/bikes/new')}>
          <Text style={styles.primaryButtonText}>Add a bike</Text>
        </Pressable>
        <Link href="/dev/gps-spike" style={styles.devLink}>
          GPS spike test screen
        </Link>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bikes}
        keyExtractor={(bike) => bike.id}
        contentContainerStyle={[styles.list, { paddingBottom: 16 + insets.bottom }]}
        renderItem={({ item }) => <BikeRow bike={item} />}
      />
      <Pressable
        style={[styles.fab, { bottom: 20 + insets.bottom }]}
        onPress={() => router.push('/bikes/new')}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

function BikeRow({ bike }: { bike: Bike }) {
  const router = useRouter();
  return (
    <Pressable style={styles.row} onPress={() => router.push(`/bikes/${bike.id}`)}>
      <Text style={styles.rowTitle}>{bike.name}</Text>
      {(bike.brand || bike.model) && (
        <Text style={styles.rowSubtitle}>{[bike.brand, bike.model].filter(Boolean).join(' ')}</Text>
      )}
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
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 20,
    backgroundColor: '#2f6f4f',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  devLink: {
    marginTop: 24,
    fontSize: 12,
    color: '#999999',
  },
  list: {
    padding: 16,
  },
  row: {
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2f6f4f',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 28,
    lineHeight: 30,
  },
});
