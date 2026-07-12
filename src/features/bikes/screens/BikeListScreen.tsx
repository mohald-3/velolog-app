import { Ionicons } from '@expo/vector-icons';
import { Link, Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Bike } from '../../../domain/types';
import { useBikes } from '../hooks/useBikes';

export default function BikeListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: bikes, isLoading } = useBikes();

  const headerOptions = {
    title: t('bikeList.headerTitle'),
    headerRight: () => (
      <View style={styles.headerActions}>
        <Pressable onPress={() => router.push('/journey')} hitSlop={12} style={styles.headerButton}>
          <Ionicons name="stats-chart-outline" size={22} color="#2f6f4f" />
        </Pressable>
        <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
          <Ionicons name="settings-outline" size={22} color="#2f6f4f" />
        </Pressable>
      </View>
    ),
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={headerOptions} />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!bikes || bikes.length === 0) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={headerOptions} />
        <Text style={styles.emptyTitle}>{t('bikeList.emptyTitle')}</Text>
        <Text style={styles.emptySubtitle}>{t('bikeList.emptySubtitle')}</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/bikes/new')}>
          <Text style={styles.primaryButtonText}>{t('bikeList.addBike')}</Text>
        </Pressable>
        <Link href="/dev/gps-spike" style={styles.devLink}>
          {t('bikeList.devLink')}
        </Link>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={headerOptions} />
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginRight: 16,
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
