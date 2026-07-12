import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MaintenanceRecord } from '../../../domain/types';
import { useComponent } from '../../bikes/hooks/useComponents';
import { useMaintenanceRecords } from '../hooks/useMaintenanceRecords';

export default function MaintenanceLogScreen() {
  const { componentId } = useLocalSearchParams<{ id: string; componentId: string }>();
  const insets = useSafeAreaInsets();
  const { data: component, isLoading: isLoadingComponent } = useComponent(componentId);
  const { data: records, isLoading: isLoadingRecords } = useMaintenanceRecords(componentId);

  if (isLoadingComponent || isLoadingRecords) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      <Stack.Screen options={{ title: `${component?.name ?? 'Component'} — Log` }} />

      {!records || records.length === 0 ? (
        <Text style={styles.emptyText}>
          No maintenance performed yet — records appear here once you mark a rule as done.
        </Text>
      ) : (
        records.map((record) => <RecordRow key={record.id} record={record} />)
      )}
    </ScrollView>
  );
}

function RecordRow({ record }: { record: MaintenanceRecord }) {
  return (
    <View style={styles.recordRow}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordAction}>{record.action}</Text>
        <Text style={styles.recordDate}>{record.performedDate.toLocaleDateString()}</Text>
      </View>
      <Text style={styles.recordMeta}>
        {(record.performedAtOdometerM / 1000).toFixed(1)} km
        {record.cost != null ? ` · ${record.cost.toFixed(2)}` : ''}
      </Text>
      {record.notes && <Text style={styles.recordNotes}>{record.notes}</Text>}
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
    fontSize: 13,
    color: '#888888',
  },
  recordRow: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recordAction: {
    fontSize: 15,
    fontWeight: '600',
  },
  recordDate: {
    fontSize: 13,
    color: '#888888',
  },
  recordMeta: {
    fontSize: 13,
    color: '#888888',
    marginTop: 2,
  },
  recordNotes: {
    fontSize: 13,
    marginTop: 6,
  },
});
