import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { MaintenanceRecord, UnitSystem } from '../../../domain/types';
import { formatDistance } from '../../../domain/units';
import i18n from '../../../i18n';
import { useComponent } from '../../bikes/hooks/useComponents';
import { useSettings } from '../../settings/hooks/useSettings';
import { useMaintenanceRecords } from '../hooks/useMaintenanceRecords';

export default function MaintenanceLogScreen() {
  const { t } = useTranslation();
  const { componentId } = useLocalSearchParams<{ id: string; componentId: string }>();
  const insets = useSafeAreaInsets();
  const { data: component, isLoading: isLoadingComponent } = useComponent(componentId);
  const { data: records, isLoading: isLoadingRecords } = useMaintenanceRecords(componentId);
  const { data: settings, isLoading: isLoadingSettings } = useSettings();

  if (isLoadingComponent || isLoadingRecords || isLoadingSettings || !settings) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const unitSystem = settings.unitSystem;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      <Stack.Screen
        options={{
          title: component
            ? t('maintenanceLog.headerTitle', { name: component.name })
            : t('maintenanceLog.headerTitleFallback'),
        }}
      />

      {!records || records.length === 0 ? (
        <Text style={styles.emptyText}>{t('maintenanceLog.emptyText')}</Text>
      ) : (
        records.map((record) => (
          <RecordRow key={record.id} record={record} unitSystem={unitSystem} />
        ))
      )}
    </ScrollView>
  );
}

function RecordRow({ record, unitSystem }: { record: MaintenanceRecord; unitSystem: UnitSystem }) {
  return (
    <View style={styles.recordRow}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordAction}>{record.action}</Text>
        <Text style={styles.recordDate}>
          {record.performedDate.toLocaleDateString(i18n.language)}
        </Text>
      </View>
      <Text style={styles.recordMeta}>
        {formatDistance(record.performedAtOdometerM, unitSystem, 1)}
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
