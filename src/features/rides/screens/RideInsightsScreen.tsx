import { Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Chip, LoadingState, StatRow } from '../../../components';
import { buildRideTrendBuckets, type RideTrendBucket, type TrendPeriod } from '../../../domain/ride-trends';
import { formatDistance } from '../../../domain/units';
import i18n from '../../../i18n';
import type { ThemeColors } from '../../../theme/colors';
import { useTheme } from '../../../theme/useTheme';
import { useBikes } from '../../bikes/hooks/useBikes';
import { useSettings } from '../../settings/hooks/useSettings';
import { DistanceChart } from '../components/DistanceChart';
import { useRideTrendRides } from '../hooks/useRideTrends';

export default function RideInsightsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: rides, isLoading: ridesLoading } = useRideTrendRides();
  const { data: bikes, isLoading: bikesLoading } = useBikes();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const [period, setPeriod] = useState<TrendPeriod>('week');
  const [bikeId, setBikeId] = useState<string | undefined>();

  const buckets = useMemo(
    () => buildRideTrendBuckets(rides ?? [], { period, bucketCount: period === 'week' ? 8 : 6, bikeId }),
    [rides, period, bikeId]
  );
  const labelFor = useCallback(
    (bucket: RideTrendBucket) => bucket.start.toLocaleDateString(i18n.language, period === 'week'
      ? { month: 'short', day: 'numeric' }
      : { month: 'short' }),
    [period]
  );

  if (ridesLoading || bikesLoading || settingsLoading || !settings) return <LoadingState />;
  const totalM = buckets.reduce((total, bucket) => total + bucket.distanceM, 0);

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      <Stack.Screen options={{ title: t('rideInsights.headerTitle') }} />
      <View style={styles.chips}>
        <Chip label={t('rideInsights.weekly')} selected={period === 'week'} onPress={() => setPeriod('week')} />
        <Chip label={t('rideInsights.monthly')} selected={period === 'month'} onPress={() => setPeriod('month')} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label={t('rideInsights.allBikes')} selected={!bikeId} onPress={() => setBikeId(undefined)} />
        {(bikes ?? []).map((bike) => <Chip key={bike.id} label={bike.name} selected={bikeId === bike.id} onPress={() => setBikeId(bike.id)} />)}
      </ScrollView>
      <Card style={styles.card}>
        <StatRow label={t('rideInsights.rangeTotal')} value={formatDistance(totalM, settings.unitSystem)} />
        <DistanceChart buckets={buckets} unitSystem={settings.unitSystem} labelFor={labelFor} />
      </Card>
      {totalM === 0 && <Text style={styles.empty}>{t('rideInsights.emptyText')}</Text>}
      <Text style={styles.sectionTitle}>{t('rideInsights.accessibleSummary')}</Text>
      <Card>
        {buckets.map((bucket) => (
          <StatRow key={bucket.start.toISOString()} label={labelFor(bucket)} value={formatDistance(bucket.distanceM, settings.unitSystem)} />
        ))}
      </Card>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: { padding: 20, backgroundColor: colors.background },
    chips: { flexDirection: 'row' },
    card: { marginTop: 12 },
    empty: { color: colors.textMuted, textAlign: 'center', marginTop: 16 },
    sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 8 },
  });
}
