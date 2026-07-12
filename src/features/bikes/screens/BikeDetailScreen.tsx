import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Component, UnitSystem } from '../../../domain/types';
import { computeDueInfo, worstDueStatus, type DueStatus } from '../../../domain/maintenance';
import { computeOdometerM } from '../../../domain/odometer';
import { formatDistance } from '../../../domain/units';
import { computeComponentWearM } from '../../../domain/wear';
import { useMaintenanceRules } from '../../maintenance/hooks/useMaintenanceRules';
import { useRides } from '../../rides/hooks/useRides';
import { useSettings } from '../../settings/hooks/useSettings';
import { useArchiveBike, useBike } from '../hooks/useBikes';
import { useComponents } from '../hooks/useComponents';

const STATUS_COLORS: Record<DueStatus, string> = {
  OK: '#2f6f4f',
  DueSoon: '#b26a00',
  Overdue: '#b00020',
};

export default function BikeDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: bike, isLoading } = useBike(id);
  const { data: components } = useComponents(id);
  const { data: rides } = useRides(id);
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const archiveBike = useArchiveBike();

  if (isLoading || isLoadingSettings || !settings) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!bike) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>{t('common.bikeNotFound')}</Text>
      </View>
    );
  }

  const unitSystem = settings.unitSystem;
  const currentOdometerM = computeOdometerM(bike, rides ?? []);

  const handleArchive = () => {
    Alert.alert(t('bikeDetail.archiveConfirmTitle'), t('bikeDetail.archiveConfirmMessage', { name: bike.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('bikeDetail.archiveBike'),
        style: 'destructive',
        onPress: async () => {
          await archiveBike.mutateAsync(bike.id);
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      <Stack.Screen options={{ title: bike.name }} />
      {bike.photoUri && <Image source={{ uri: bike.photoUri }} style={styles.photo} />}

      <Text style={styles.title}>{bike.name}</Text>
      {(bike.brand || bike.model) && (
        <Text style={styles.subtitle}>{[bike.brand, bike.model].filter(Boolean).join(' ')}</Text>
      )}

      <View style={styles.card}>
        <Row label={t('bikeDetail.odometerLabel')} value={formatDistance(currentOdometerM, unitSystem)} />
        {bike.year != null && <Row label={t('bikeDetail.yearLabel')} value={String(bike.year)} />}
        {bike.color && <Row label={t('bikeDetail.colorLabel')} value={bike.color} />}
        {bike.frameSize && <Row label={t('bikeDetail.frameSizeLabel')} value={bike.frameSize} />}
      </View>

      {bike.notes && (
        <View style={styles.card}>
          <Text style={styles.label}>{t('bikeDetail.notes')}</Text>
          <Text style={styles.notes}>{bike.notes}</Text>
        </View>
      )}

      <View style={styles.componentsHeader}>
        <Text style={styles.sectionTitle}>{t('bikeDetail.components')}</Text>
        <Pressable onPress={() => router.push(`/bikes/${bike.id}/components/new`)}>
          <Text style={styles.addComponentLink}>{t('bikeDetail.addComponent')}</Text>
        </Pressable>
      </View>

      {!components || components.length === 0 ? (
        <Text style={styles.emptyComponents}>{t('bikeDetail.emptyComponents')}</Text>
      ) : (
        components.map((component) => (
          <ComponentRow
            key={component.id}
            bikeId={bike.id}
            component={component}
            currentOdometerM={currentOdometerM}
            unitSystem={unitSystem}
          />
        ))
      )}

      <Pressable style={styles.primaryButton} onPress={() => router.push(`/bikes/${bike.id}/record`)}>
        <Text style={styles.primaryButtonText}>{t('bikeDetail.startRide')}</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.push(`/bikes/${bike.id}/rides`)}>
        <Text style={styles.secondaryButtonText}>
          {t('bikeDetail.viewRides')}
          {rides && rides.length > 0 ? ` (${rides.length})` : ''}
        </Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.push(`/bikes/${bike.id}/stats`)}>
        <Text style={styles.secondaryButtonText}>{t('bikeDetail.statistics')}</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => router.push(`/bikes/${bike.id}/edit`)}>
        <Text style={styles.secondaryButtonText}>{t('bikeDetail.edit')}</Text>
      </Pressable>
      <Pressable style={styles.archiveButton} onPress={handleArchive}>
        <Text style={styles.archiveButtonText}>{t('bikeDetail.archiveBike')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function ComponentRow({
  bikeId,
  component,
  currentOdometerM,
  unitSystem,
}: {
  bikeId: string;
  component: Component;
  currentOdometerM: number;
  unitSystem: UnitSystem;
}) {
  const router = useRouter();
  const wearLabel = formatDistance(computeComponentWearM(currentOdometerM, component.installedAtOdometerM), unitSystem, 0);
  const { data: rules } = useMaintenanceRules(component.id);
  const status = worstDueStatus((rules ?? []).map((rule) => computeDueInfo(rule, currentOdometerM).status));

  return (
    <Pressable
      style={styles.componentRow}
      onPress={() => router.push(`/bikes/${bikeId}/components/${component.id}/edit`)}
    >
      <View>
        <View style={styles.componentNameRow}>
          <Text style={styles.componentName}>{component.name}</Text>
          {status && status !== 'OK' && (
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[status] }]} />
          )}
        </View>
        <Text style={styles.componentType}>{component.type}</Text>
      </View>
      <Text style={styles.componentWear}>{wearLabel}</Text>
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
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    color: '#888888',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
  },
  notes: {
    fontSize: 14,
    marginTop: 6,
  },
  componentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  addComponentLink: {
    fontSize: 14,
    color: '#2f6f4f',
    fontWeight: '600',
  },
  emptyComponents: {
    fontSize: 13,
    color: '#888888',
    marginTop: 8,
  },
  componentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  componentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  componentName: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  componentType: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  componentWear: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2f6f4f',
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: '#2f6f4f',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 12,
    backgroundColor: '#f2f2f2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2f6f4f',
    fontWeight: '600',
    fontSize: 16,
  },
  archiveButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  archiveButtonText: {
    color: '#b00020',
    fontWeight: '600',
  },
});
