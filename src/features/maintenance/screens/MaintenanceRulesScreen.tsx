import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { computeDueInfo, type DueStatus } from '../../../domain/maintenance';
import { computeOdometerM } from '../../../domain/odometer';
import type { MaintenanceRule, UnitSystem } from '../../../domain/types';
import { formatDistance } from '../../../domain/units';
import type { ThemeColors } from '../../../theme/colors';
import { useTheme } from '../../../theme/useTheme';
import { useBike } from '../../bikes/hooks/useBikes';
import { useComponent } from '../../bikes/hooks/useComponents';
import { useRides } from '../../rides/hooks/useRides';
import { useSettings } from '../../settings/hooks/useSettings';
import { useMaintenanceRules } from '../hooks/useMaintenanceRules';

export default function MaintenanceRulesScreen() {
  const { t } = useTranslation();
  const { id: bikeId, componentId } = useLocalSearchParams<{ id: string; componentId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: bike, isLoading: isLoadingBike } = useBike(bikeId);
  const { data: component, isLoading: isLoadingComponent } = useComponent(componentId);
  const { data: rides, isLoading: isLoadingRides } = useRides(bikeId);
  const { data: rules, isLoading: isLoadingRules } = useMaintenanceRules(componentId);
  const { data: settings, isLoading: isLoadingSettings } = useSettings();

  if (isLoadingBike || isLoadingComponent || isLoadingRides || isLoadingRules || isLoadingSettings || !settings) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!bike || !component) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>{t('common.notFound')}</Text>
      </View>
    );
  }

  const currentOdometerM = computeOdometerM(bike, rides ?? []);
  const unitSystem = settings.unitSystem;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      <Stack.Screen options={{ title: t('maintenanceRules.headerTitle', { name: component.name }) }} />

      {!rules || rules.length === 0 ? (
        <Text style={styles.emptyText}>{t('maintenanceRules.emptyText')}</Text>
      ) : (
        rules.map((rule) => (
          <RuleRow
            key={rule.id}
            rule={rule}
            currentOdometerM={currentOdometerM}
            unitSystem={unitSystem}
            colors={colors}
            styles={styles}
            onPress={() => router.push(`/bikes/${bikeId}/components/${componentId}/rules/${rule.id}/edit`)}
          />
        ))
      )}

      <Pressable
        style={styles.addButton}
        onPress={() => router.push(`/bikes/${bikeId}/components/${componentId}/rules/new`)}
      >
        <Text style={styles.addButtonText}>{t('maintenanceRules.addRule')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function RuleRow({
  rule,
  currentOdometerM,
  unitSystem,
  colors,
  styles,
  onPress,
}: {
  rule: MaintenanceRule;
  currentOdometerM: number;
  unitSystem: UnitSystem;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { dueInM, status } = computeDueInfo(rule, currentOdometerM);
  const dueLabel =
    status === 'Overdue'
      ? t('maintenanceRules.overdueBy', { amount: formatDistance(Math.abs(dueInM), unitSystem, 0) })
      : t('maintenanceRules.dueIn', { amount: formatDistance(dueInM, unitSystem, 0) });
  const statusColors: Record<DueStatus, string> = {
    OK: colors.primary,
    DueSoon: colors.warning,
    Overdue: colors.danger,
  };

  return (
    <Pressable style={styles.ruleRow} onPress={onPress}>
      <View>
        <Text style={styles.ruleAction}>{rule.action}</Text>
        <Text style={styles.ruleMeta}>
          {t('maintenanceRules.everyInterval', { interval: formatDistance(rule.intervalM, unitSystem, 0) })} ·{' '}
          {dueLabel}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusColors[status] }]}>
        <Text style={styles.statusBadgeText}>{t(`dueStatus.${status}`)}</Text>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    notFound: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    content: {
      padding: 20,
      backgroundColor: colors.background,
    },
    emptyText: {
      fontSize: 13,
      color: colors.textMuted,
    },
    ruleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 14,
      marginTop: 8,
    },
    ruleAction: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    ruleMeta: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    statusBadge: {
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    statusBadgeText: {
      color: colors.onPrimary,
      fontSize: 12,
      fontWeight: '700',
    },
    addButton: {
      marginTop: 20,
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    addButtonText: {
      color: colors.onPrimary,
      fontWeight: '600',
      fontSize: 16,
    },
  });
}
