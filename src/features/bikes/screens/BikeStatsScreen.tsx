import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
          <Stat label={t('bikeStats.totalRides')} value={String(stats.rideCount)} styles={styles} />
          <Stat label={t('bikeStats.totalDistance')} value={formatDistance(stats.totalDistanceM, unitSystem)} styles={styles} />
          <Stat label={t('bikeStats.totalTime')} value={formatDuration(stats.totalTimeMs)} styles={styles} />
          <Stat label={t('bikeStats.longestRide')} value={formatDistance(stats.longestRideM, unitSystem, 2)} styles={styles} />
          <Stat label={t('bikeStats.averageRide')} value={formatDistance(stats.averageRideM, unitSystem, 2)} styles={styles} />
        </View>
      )}
    </ScrollView>
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
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 20,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
    },
    stat: {
      marginTop: 8,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textMuted,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
  });
}
