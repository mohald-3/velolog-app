import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MilestoneProgress } from '../../../domain/journey';
import type { UnitSystem } from '../../../domain/types';
import { distanceUnitLabel, formatDistance, metersToDistanceUnit } from '../../../domain/units';
import { useSettings } from '../../settings/hooks/useSettings';
import { useJourneyStats } from '../hooks/useJourneyStats';

export default function JourneyStatsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: stats, isLoading: isLoadingStats } = useJourneyStats();
  const { data: settings, isLoading: isLoadingSettings } = useSettings();

  if (isLoadingStats || isLoadingSettings || !stats || !settings) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const unitSystem = settings.unitSystem;

  if (stats.totalRideCount === 0) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: t('journey.headerTitle') }} />
        <Text style={styles.emptyText}>{t('journey.emptyText')}</Text>
      </View>
    );
  }

  const distanceInUnit = metersToDistanceUnit(stats.totalDistanceM, unitSystem);
  const costPerUnit = distanceInUnit > 0 ? stats.totalCost / distanceInUnit : null;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      <Stack.Screen options={{ title: t('journey.headerTitle') }} />

      <View style={styles.card}>
        <Stat label={t('journey.totalDistance')} value={formatDistance(stats.totalDistanceM, unitSystem)} />
        <Stat label={t('journey.totalRides')} value={String(stats.totalRideCount)} />
        {costPerUnit != null && (
          <Stat
            label={t('journey.costPerUnit', { unit: distanceUnitLabel(unitSystem) })}
            value={costPerUnit.toFixed(2)}
          />
        )}
        <Stat label={t('journey.co2Saved')} value={`${stats.co2SavedKg.toFixed(1)} kg`} />
        <Stat label={t('journey.calories')} value={`${stats.caloriesBurned.toFixed(0)} kcal`} />
      </View>

      <Text style={styles.sectionTitle}>{t('journey.milestonesTitle')}</Text>
      <View style={styles.card}>
        {stats.milestones.map((milestone) => (
          <MilestoneRow key={milestone.id} milestone={milestone} unitSystem={unitSystem} />
        ))}
      </View>
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

function MilestoneRow({ milestone, unitSystem }: { milestone: MilestoneProgress; unitSystem: UnitSystem }) {
  const { t } = useTranslation();
  return (
    <View style={styles.milestoneRow}>
      <Text style={[styles.milestoneLabel, milestone.reached && styles.milestoneLabelReached]}>
        {t(`journey.milestones.${milestone.id}`)}
      </Text>
      <Text style={styles.milestoneStatus}>
        {milestone.reached
          ? '✓'
          : t('journey.milestoneRemaining', { distance: formatDistance(milestone.remainingM, unitSystem, 0) })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  content: {
    padding: 20,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
  },
  milestoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  milestoneLabel: {
    fontSize: 14,
    color: '#888888',
  },
  milestoneLabelReached: {
    color: '#2f6f4f',
    fontWeight: '600',
  },
  milestoneStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2f6f4f',
  },
});
