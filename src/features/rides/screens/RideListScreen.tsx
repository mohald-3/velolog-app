import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingState } from '../../../components';
import { speedKmh } from '../../../domain/gps-filter';
import { groupRidesByDay } from '../../../domain/stats';
import type { Ride, UnitSystem } from '../../../domain/types';
import { formatDistance, formatSpeed } from '../../../domain/units';
import { useSettings } from '../../settings/hooks/useSettings';
import type { ThemeColors } from '../../../theme/colors';
import { useTheme } from '../../../theme/useTheme';
import i18n from '../../../i18n';
import { formatDuration } from '../format';
import { useRides } from '../hooks/useRides';

function formatDayHeader(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(i18n.language, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function RideListScreen() {
  const { t } = useTranslation();
  const { id: bikeId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: rides, isLoading } = useRides(bikeId);
  const { data: settings, isLoading: isLoadingSettings } = useSettings();

  if (isLoading || isLoadingSettings || !settings) {
    return <LoadingState />;
  }

  const groups = groupRidesByDay(rides ?? []);
  const unitSystem = settings.unitSystem;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: t('rideList.headerTitle'),
        headerRight: () => (
          <Pressable accessibilityLabel={t('rideImport.importGpx')} hitSlop={12} onPress={() => router.push(`/bikes/${bikeId}/rides/import`)}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </Pressable>
        ),
      }} />
      {groups.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{t('rideList.emptyText')}</Text>
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
            <RideRow
              ride={ride}
              unitSystem={unitSystem}
              styles={styles}
              onPress={() => router.push(`/bikes/${bikeId}/rides/${ride.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

function RideRow({
  ride,
  unitSystem,
  styles,
  onPress,
}: {
  ride: Ride;
  unitSystem: UnitSystem;
  styles: ReturnType<typeof createStyles>;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const durationMs = ride.endedAt.getTime() - ride.startedAt.getTime();
  const avgSpeedKmh = speedKmh(ride.distanceM, ride.movingTimeMs);

  return (
    <Pressable style={styles.rideRow} onPress={onPress}>
      <View>
        <Text style={styles.rideDistance}>{formatDistance(ride.distanceM, unitSystem, 2)}</Text>
        <Text style={styles.rideMeta}>
          {formatDuration(durationMs)} · {formatSpeed(avgSpeedKmh, unitSystem)} {t('rideList.avgSuffix')}
        </Text>
      </View>
      <Text style={styles.rideTime}>
        {ride.startedAt.toLocaleTimeString(i18n.language, { hour: 'numeric', minute: '2-digit' })}
      </Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
    },
    content: {
      padding: 20,
    },
    sectionHeader: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textMuted,
      marginTop: 16,
      marginBottom: 8,
    },
    rideRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 14,
      marginTop: 8,
    },
    rideDistance: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
    },
    rideMeta: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    rideTime: {
      fontSize: 13,
      color: colors.textMuted,
    },
  });
}
