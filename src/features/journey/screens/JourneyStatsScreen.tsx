import { Stack } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MilestoneProgress } from '../../../domain/journey';
import type { UnitSystem } from '../../../domain/types';
import { distanceUnitLabel, formatDistance, metersToDistanceUnit } from '../../../domain/units';
import type { ThemeColors } from '../../../theme/colors';
import { useTheme } from '../../../theme/useTheme';
import { useSettings } from '../../settings/hooks/useSettings';
import { useJourneyStats } from '../hooks/useJourneyStats';

export default function JourneyStatsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
        <Stat label={t('journey.totalDistance')} value={formatDistance(stats.totalDistanceM, unitSystem)} styles={styles} />
        <Stat label={t('journey.totalRides')} value={String(stats.totalRideCount)} styles={styles} />
        {costPerUnit != null && (
          <Stat
            label={t('journey.costPerUnit', { unit: distanceUnitLabel(unitSystem) })}
            value={costPerUnit.toFixed(2)}
            styles={styles}
          />
        )}
        <Stat label={t('journey.co2Saved')} value={`${stats.co2SavedKg.toFixed(1)} kg`} styles={styles} />
        <Stat label={t('journey.calories')} value={`${stats.caloriesBurned.toFixed(0)} kcal`} styles={styles} />
      </View>

      <Text style={styles.sectionTitle}>{t('journey.milestonesTitle')}</Text>
      <View style={styles.card}>
        {stats.milestones.map((milestone) => (
          <MilestoneRow key={milestone.id} milestone={milestone} unitSystem={unitSystem} styles={styles} />
        ))}
      </View>
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
    content: {
      padding: 20,
      backgroundColor: colors.background,
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
