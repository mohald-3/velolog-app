import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { computeBikeStats } from '../../../domain/stats';
import { formatDistance } from '../../../domain/units';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatDuration } from '../../rides/format';
import { useRides } from '../../rides/hooks/useRides';
import { useBike } from '../hooks/useBikes';

export default function BikeStatsScreen() {
  const { t } = useTranslation();
  const { id: bikeId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: bike, isLoading: isLoadingBike } = useBike(bikeId);
  const { data: rides, isLoading: isLoadingRides } = useRides(bikeId);
  const { data: settings, isLoading: isLoadingSettings } = useSettings();

  if (isLoadingBike || isLoadingRides || isLoadingSettings || !settings) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const stats = computeBikeStats(rides ?? []);
  const unitSystem = settings.unitSystem;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      <Stack.Screen
        options={{ title: bike ? t('bikeStats.headerTitle', { name: bike.name }) : t('bikeStats.headerTitleFallback') }}
      />

      {stats.rideCount === 0 ? (
        <Text style={styles.emptyText}>{t('bikeStats.emptyText')}</Text>
      ) : (
        <View style={styles.card}>
          <Stat label={t('bikeStats.totalRides')} value={String(stats.rideCount)} />
          <Stat label={t('bikeStats.totalDistance')} value={formatDistance(stats.totalDistanceM, unitSystem)} />
          <Stat label={t('bikeStats.totalTime')} value={formatDuration(stats.totalTimeMs)} />
          <Stat label={t('bikeStats.longestRide')} value={formatDistance(stats.longestRideM, unitSystem, 2)} />
          <Stat label={t('bikeStats.averageRide')} value={formatDistance(stats.averageRideM, unitSystem, 2)} />
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
