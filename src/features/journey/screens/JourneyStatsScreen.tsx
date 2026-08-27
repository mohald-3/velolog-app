import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, LoadingState, StatRow } from '../../../components';
import type { MilestoneProgress } from '../../../domain/journey';
import type { UnitSystem } from '../../../domain/types';
import { distanceUnitLabel, formatDistance, metersToDistanceUnit } from '../../../domain/units';
import type { ThemeColors } from '../../../theme/colors';
import { useTheme } from '../../../theme/useTheme';
import { useSettings } from '../../settings/hooks/useSettings';
import { useJourneyStats } from '../hooks/useJourneyStats';

export default function JourneyStatsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: stats, isLoading: isLoadingStats } = useJourneyStats();
  const { data: settings, isLoading: isLoadingSettings } = useSettings();

  if (isLoadingStats || isLoadingSettings || !stats || !settings) {
    return <LoadingState />;
  }

  const unitSystem = settings.unitSystem;

  if (stats.totalRideCount === 0) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: t('journey.headerTitle') }} />
        <Text style={styles.emptyText}>{t('journey.emptyText')}</Text>
        <Button title={t('rideInsights.viewInsights')} onPress={() => router.push('/rides/insights')} style={styles.insightsButton} />
      </View>
    );
  }

  const distanceInUnit = metersToDistanceUnit(stats.totalDistanceM, unitSystem);
  const costPerUnit = distanceInUnit > 0 ? stats.totalCost / distanceInUnit : null;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      <Stack.Screen options={{ title: t('journey.headerTitle') }} />

      <Card>
        <StatRow label={t('journey.totalDistance')} value={formatDistance(stats.totalDistanceM, unitSystem)} />
        <StatRow label={t('journey.totalRides')} value={String(stats.totalRideCount)} />
        {costPerUnit != null && (
          <StatRow
            label={t('journey.costPerUnit', { unit: distanceUnitLabel(unitSystem) })}
            value={costPerUnit.toFixed(2)}
          />
        )}
        <StatRow label={t('journey.co2Saved')} value={`${stats.co2SavedKg.toFixed(1)} kg`} />
        <StatRow label={t('journey.calories')} value={`${stats.caloriesBurned.toFixed(0)} kcal`} />
      </Card>
      <Button title={t('rideInsights.viewInsights')} onPress={() => router.push('/rides/insights')} variant="secondary" style={styles.insightsButton} />

      <Text style={styles.sectionTitle}>{t('journey.milestonesTitle')}</Text>
      <Card>
        {stats.milestones.map((milestone) => (
          <MilestoneRow key={milestone.id} milestone={milestone} unitSystem={unitSystem} styles={styles} />
        ))}
      </Card>
    </ScrollView>
  );
}

function MilestoneRow({
  milestone,
  unitSystem,
  styles,
}: {
  milestone: MilestoneProgress;
  unitSystem: UnitSystem;
  styles: ReturnType<typeof createStyles>;
}) {
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
    },
    insightsButton: { marginTop: 20 },
    content: {
      padding: 20,
      backgroundColor: colors.background,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginTop: 24,
      marginBottom: 8,
      color: colors.text,
    },
    milestoneRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
    },
    milestoneLabel: {
      fontSize: 14,
      color: colors.textMuted,
    },
    milestoneLabelReached: {
      color: colors.primary,
      fontWeight: '600',
    },
    milestoneStatus: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
  });
}
