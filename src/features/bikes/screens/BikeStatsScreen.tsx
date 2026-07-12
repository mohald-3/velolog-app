import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, LoadingState, StatRow } from '../../../components';
import { computeBikeStats } from '../../../domain/stats';
import { formatDistance } from '../../../domain/units';
import type { ThemeColors } from '../../../theme/colors';
import { useTheme } from '../../../theme/useTheme';
import { useSettings } from '../../settings/hooks/useSettings';
import { formatDuration } from '../../rides/format';
import { useRides } from '../../rides/hooks/useRides';
import { useBike } from '../hooks/useBikes';

export default function BikeStatsScreen() {
  const { t } = useTranslation();
  const { id: bikeId } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: bike, isLoading: isLoadingBike } = useBike(bikeId);
  const { data: rides, isLoading: isLoadingRides } = useRides(bikeId);
  const { data: settings, isLoading: isLoadingSettings } = useSettings();

  if (isLoadingBike || isLoadingRides || isLoadingSettings || !settings) {
    return <LoadingState />;
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
        <Card>
          <StatRow label={t('bikeStats.totalRides')} value={String(stats.rideCount)} />
          <StatRow label={t('bikeStats.totalDistance')} value={formatDistance(stats.totalDistanceM, unitSystem)} />
          <StatRow label={t('bikeStats.totalTime')} value={formatDuration(stats.totalTimeMs)} />
          <StatRow label={t('bikeStats.longestRide')} value={formatDistance(stats.longestRideM, unitSystem, 2)} />
          <StatRow label={t('bikeStats.averageRide')} value={formatDistance(stats.averageRideM, unitSystem, 2)} />
        </Card>
      )}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      padding: 20,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 20,
    },
  });
}
