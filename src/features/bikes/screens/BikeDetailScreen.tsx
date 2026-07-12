import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Component, UnitSystem } from '../../../domain/types';
import { computeDueInfo, worstDueStatus, type DueStatus } from '../../../domain/maintenance';
import { computeOdometerM } from '../../../domain/odometer';
import { formatDistance } from '../../../domain/units';
import { computeComponentWearM } from '../../../domain/wear';
import type { ThemeColors } from '../../../theme/colors';
import { useTheme } from '../../../theme/useTheme';
import { useMaintenanceRules } from '../../maintenance/hooks/useMaintenanceRules';
import { useRides } from '../../rides/hooks/useRides';
import { useSettings } from '../../settings/hooks/useSettings';
import { useArchiveBike, useBike } from '../hooks/useBikes';
import { useComponents } from '../hooks/useComponents';

export default function BikeDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
        <Row label={t('bikeDetail.odometerLabel')} value={formatDistance(currentOdometerM, unitSystem)} styles={styles} />
        {bike.year != null && <Row label={t('bikeDetail.yearLabel')} value={String(bike.year)} styles={styles} />}
        {bike.color && <Row label={t('bikeDetail.colorLabel')} value={bike.color} styles={styles} />}
        {bike.frameSize && <Row label={t('bikeDetail.frameSizeLabel')} value={bike.frameSize} styles={styles} />}
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
            styles={styles}
            colors={colors}
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

function Row({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
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
  styles,
  colors,
}: {
  bikeId: string;
  component: Component;
  currentOdometerM: number;
  unitSystem: UnitSystem;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const wearLabel = formatDistance(computeComponentWearM(currentOdometerM, component.installedAtOdometerM), unitSystem, 0);
  const { data: rules } = useMaintenanceRules(component.id);
  const status = worstDueStatus((rules ?? []).map((rule) => computeDueInfo(rule, currentOdometerM).status));
  const statusColors: Record<DueStatus, string> = {
    OK: colors.primary,
    DueSoon: colors.warning,
    Overdue: colors.danger,
  };

  return (
    <Pressable
      style={styles.componentRow}
      onPress={() => router.push(`/bikes/${bikeId}/components/${component.id}/edit`)}
    >
      <View>
        <View style={styles.componentNameRow}>
          <Text style={styles.componentName}>{component.name}</Text>
          {status && status !== 'OK' && (
            <View style={[styles.statusDot, { backgroundColor: statusColors[status] }]} />
          )}
        </View>
        <Text style={styles.componentType}>{t(`componentType.${component.type}`)}</Text>
      </View>
      <Text style={styles.componentWear}>{wearLabel}</Text>
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
    photo: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    card: {
      backgroundColor: colors.surface,
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
      color: colors.textMuted,
    },
    value: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    notes: {
      fontSize: 14,
      marginTop: 6,
      color: colors.text,
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
      color: colors.text,
    },
    addComponentLink: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    emptyComponents: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 8,
    },
    componentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
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
      color: colors.text,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginLeft: 6,
    },
    componentType: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    componentWear: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    primaryButton: {
      marginTop: 24,
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: colors.onPrimary,
      fontWeight: '600',
      fontSize: 16,
    },
    secondaryButton: {
      marginTop: 12,
      backgroundColor: colors.surface,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: colors.primary,
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
      color: colors.danger,
      fontWeight: '600',
    },
  });
}
