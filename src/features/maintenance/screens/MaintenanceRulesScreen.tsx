import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { computeDueInfo, type DueStatus } from '../../../domain/maintenance';
import { computeOdometerM } from '../../../domain/odometer';
import type { MaintenanceRule } from '../../../domain/types';
import { useBike } from '../../bikes/hooks/useBikes';
import { useComponent } from '../../bikes/hooks/useComponents';
import { useRides } from '../../rides/hooks/useRides';
import { useMaintenanceRules } from '../hooks/useMaintenanceRules';

const STATUS_COLORS: Record<DueStatus, string> = {
  OK: '#2f6f4f',
  DueSoon: '#b26a00',
  Overdue: '#b00020',
};

export default function MaintenanceRulesScreen() {
  const { id: bikeId, componentId } = useLocalSearchParams<{ id: string; componentId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: bike, isLoading: isLoadingBike } = useBike(bikeId);
  const { data: component, isLoading: isLoadingComponent } = useComponent(componentId);
  const { data: rides, isLoading: isLoadingRides } = useRides(bikeId);
  const { data: rules, isLoading: isLoadingRules } = useMaintenanceRules(componentId);

  if (isLoadingBike || isLoadingComponent || isLoadingRides || isLoadingRules) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!bike || !component) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Not found.</Text>
      </View>
    );
  }

  const currentOdometerM = computeOdometerM(bike, rides ?? []);

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      <Stack.Screen options={{ title: `${component.name} — Maintenance` }} />

      {!rules || rules.length === 0 ? (
        <Text style={styles.emptyText}>
          No maintenance rules yet — add one to start tracking service intervals for this component.
        </Text>
      ) : (
        rules.map((rule) => (
          <RuleRow
            key={rule.id}
            rule={rule}
            currentOdometerM={currentOdometerM}
            onPress={() => router.push(`/bikes/${bikeId}/components/${componentId}/rules/${rule.id}/edit`)}
          />
        ))
      )}

      <Pressable
        style={styles.addButton}
        onPress={() => router.push(`/bikes/${bikeId}/components/${componentId}/rules/new`)}
      >
        <Text style={styles.addButtonText}>+ Add rule</Text>
      </Pressable>
    </ScrollView>
  );
}

function RuleRow({
  rule,
  currentOdometerM,
  onPress,
}: {
  rule: MaintenanceRule;
  currentOdometerM: number;
  onPress: () => void;
}) {
  const { dueInM, status } = computeDueInfo(rule, currentOdometerM);
  const dueLabel =
    status === 'Overdue'
      ? `Overdue by ${(Math.abs(dueInM) / 1000).toFixed(0)} km`
      : `Due in ${(dueInM / 1000).toFixed(0)} km`;

  return (
    <Pressable style={styles.ruleRow} onPress={onPress}>
      <View>
        <Text style={styles.ruleAction}>{rule.action}</Text>
        <Text style={styles.ruleMeta}>
          Every {(rule.intervalM / 1000).toFixed(0)} km · {dueLabel}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[status] }]}>
        <Text style={styles.statusBadgeText}>{status}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    fontSize: 16,
    color: '#666666',
  },
  content: {
    padding: 20,
  },
  emptyText: {
    fontSize: 13,
    color: '#888888',
  },
  ruleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
  },
  ruleAction: {
    fontSize: 15,
    fontWeight: '600',
  },
  ruleMeta: {
    fontSize: 13,
    color: '#888888',
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  addButton: {
    marginTop: 20,
    backgroundColor: '#2f6f4f',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
