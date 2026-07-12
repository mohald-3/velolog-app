import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Component, ComponentType, UnitSystem } from '../../../domain/types';
import { componentTypeValues } from '../../../data/schema';
import { computeOdometerM } from '../../../domain/odometer';
import { distanceUnitLabel, distanceUnitToMeters, formatDistance, metersToDistanceUnit } from '../../../domain/units';
import { useMaintenanceRules } from '../../maintenance/hooks/useMaintenanceRules';
import { useRides } from '../../rides/hooks/useRides';
import { useSettings } from '../../settings/hooks/useSettings';
import { useBike } from '../hooks/useBikes';
import {
  useComponent,
  useCreateComponent,
  useRetireComponent,
  useReplaceComponent,
  useUpdateComponent,
} from '../hooks/useComponents';

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function AddEditComponentScreen() {
  const { id: bikeId, componentId } = useLocalSearchParams<{ id: string; componentId?: string }>();
  const isEditing = Boolean(componentId);

  const { data: bike, isLoading: isLoadingBike } = useBike(bikeId);
  const { data: rides, isLoading: isLoadingRides } = useRides(bikeId);
  const { data: existingComponent, isLoading: isLoadingComponent } = useComponent(componentId);
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const { t } = useTranslation();

  if (isLoadingBike || isLoadingRides || (isEditing && isLoadingComponent) || isLoadingSettings || !settings) {
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

  return (
    <ComponentForm
      key={existingComponent?.id ?? 'new'}
      bikeId={bikeId}
      currentOdometerM={computeOdometerM(bike, rides ?? [])}
      initialComponent={existingComponent ?? null}
      unitSystem={settings.unitSystem}
    />
  );
}

function ComponentForm({
  bikeId,
  currentOdometerM,
  initialComponent,
  unitSystem,
}: {
  bikeId: string;
  currentOdometerM: number;
  initialComponent: Component | null;
  unitSystem: UnitSystem;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: rules } = useMaintenanceRules(initialComponent?.id);
  const insets = useSafeAreaInsets();
  const isEditing = Boolean(initialComponent);
  const createComponent = useCreateComponent();
  const updateComponent = useUpdateComponent();
  const retireComponent = useRetireComponent();
  const replaceComponent = useReplaceComponent();

  const [type, setType] = useState<ComponentType>(initialComponent?.type ?? 'Chain');
  const [name, setName] = useState(initialComponent?.name ?? '');
  const [installedAtOdometerDisplay, setInstalledAtOdometerDisplay] = useState(
    String(metersToDistanceUnit(initialComponent?.installedAtOdometerM ?? currentOdometerM, unitSystem))
  );
  const [installedDate, setInstalledDate] = useState(
    toDateInputValue(initialComponent?.installedDate ?? new Date())
  );
  const [expectedLifetimeDisplay, setExpectedLifetimeDisplay] = useState(
    initialComponent?.expectedLifetimeKm != null
      ? String(metersToDistanceUnit(initialComponent.expectedLifetimeKm * 1000, unitSystem))
      : ''
  );
  const [notes, setNotes] = useState(initialComponent?.notes ?? '');

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert(t('addEditComponent.nameRequiredTitle'), t('addEditComponent.nameRequiredMessage'));
      return;
    }

    const parsedOdometerDisplay = installedAtOdometerDisplay.trim() ? Number(installedAtOdometerDisplay) : NaN;
    const parsedDate = new Date(installedDate);
    const parsedLifetimeDisplay = expectedLifetimeDisplay.trim() ? Number(expectedLifetimeDisplay) : null;

    if (Number.isNaN(parsedOdometerDisplay)) {
      Alert.alert(t('addEditComponent.invalidOdometerTitle'), t('addEditComponent.invalidOdometerMessage'));
      return;
    }
    if (Number.isNaN(parsedDate.getTime())) {
      Alert.alert(t('addEditComponent.invalidDateTitle'), t('addEditComponent.invalidDateMessage'));
      return;
    }
    if (parsedLifetimeDisplay != null && Number.isNaN(parsedLifetimeDisplay)) {
      Alert.alert(t('addEditComponent.invalidLifetimeTitle'), t('addEditComponent.invalidLifetimeMessage'));
      return;
    }

    const values = {
      type,
      name: name.trim(),
      installedAtOdometerM: Math.round(distanceUnitToMeters(parsedOdometerDisplay, unitSystem)),
      installedDate: parsedDate,
      expectedLifetimeKm:
        parsedLifetimeDisplay != null ? distanceUnitToMeters(parsedLifetimeDisplay, unitSystem) / 1000 : null,
      notes: notes.trim() || null,
    };

    if (isEditing && initialComponent) {
      await updateComponent.mutateAsync({ id: initialComponent.id, changes: values });
    } else {
      await createComponent.mutateAsync({ bikeId, ...values });
    }
    router.back();
  };

  const handleReplace = () => {
    if (!initialComponent) return;
    Alert.alert(
      t('addEditComponent.replaceConfirmTitle'),
      t('addEditComponent.replaceConfirmMessage', {
        name: initialComponent.name,
        type: initialComponent.type,
        odometer: formatDistance(currentOdometerM, unitSystem, 1),
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('addEditComponent.replaceComponent'),
          onPress: async () => {
            await replaceComponent.mutateAsync({ oldComponent: initialComponent, currentOdometerM });
            router.back();
          },
        },
      ]
    );
  };

  const handleRetire = () => {
    if (!initialComponent) return;
    Alert.alert(
      t('addEditComponent.retireConfirmTitle'),
      t('addEditComponent.retireConfirmMessage', { name: initialComponent.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('addEditComponent.retireComponent'),
          style: 'destructive',
          onPress: async () => {
            await retireComponent.mutateAsync({ id: initialComponent.id, bikeId });
            router.back();
          },
        },
      ]
    );
  };

  const saving = createComponent.isPending || updateComponent.isPending;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      <Text style={styles.label}>{t('addEditComponent.typeLabel')}</Text>
      <View style={styles.chipRow}>
        {componentTypeValues.map((value) => (
          <Pressable
            key={value}
            style={[styles.chip, type === value && styles.chipSelected]}
            onPress={() => setType(value)}
          >
            <Text style={[styles.chipText, type === value && styles.chipTextSelected]}>{value}</Text>
          </Pressable>
        ))}
      </View>

      <Field
        label={t('addEditComponent.nameLabel')}
        value={name}
        onChangeText={setName}
        placeholder={t('addEditComponent.namePlaceholder')}
      />
      <Field
        label={t('addEditComponent.installedAtOdometerLabel', { unit: distanceUnitLabel(unitSystem) })}
        value={installedAtOdometerDisplay}
        onChangeText={setInstalledAtOdometerDisplay}
        keyboardType="decimal-pad"
      />
      <Field
        label={t('addEditComponent.installedDateLabel')}
        value={installedDate}
        onChangeText={setInstalledDate}
      />
      <Field
        label={t('addEditComponent.expectedLifetimeLabel', { unit: distanceUnitLabel(unitSystem) })}
        value={expectedLifetimeDisplay}
        onChangeText={setExpectedLifetimeDisplay}
        keyboardType="decimal-pad"
      />
      <Field label={t('common.notesOptional')} value={notes} onChangeText={setNotes} />

      <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={saving}>
        <Text style={styles.primaryButtonText}>
          {saving ? t('common.saving') : isEditing ? t('common.saveChanges') : t('addEditComponent.addComponent')}
        </Text>
      </Pressable>

      {isEditing && initialComponent && (
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push(`/bikes/${bikeId}/components/${initialComponent.id}/rules`)}
        >
          <Text style={styles.secondaryButtonText}>
            {t('addEditComponent.maintenanceRules')}
            {rules && rules.length > 0 ? ` (${rules.length})` : ''}
          </Text>
        </Pressable>
      )}

      {isEditing && initialComponent && (
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push(`/bikes/${bikeId}/components/${initialComponent.id}/log`)}
        >
          <Text style={styles.secondaryButtonText}>{t('addEditComponent.maintenanceLog')}</Text>
        </Pressable>
      )}

      {isEditing && (
        <Pressable style={styles.secondaryButton} onPress={handleReplace} disabled={replaceComponent.isPending}>
          <Text style={styles.secondaryButtonText}>
            {replaceComponent.isPending ? t('addEditComponent.replacing') : t('addEditComponent.replaceComponent')}
          </Text>
        </Pressable>
      )}

      {isEditing && (
        <Pressable style={styles.retireButton} onPress={handleRetire}>
          <Text style={styles.retireButtonText}>{t('addEditComponent.retireComponent')}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'decimal-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        keyboardType={props.keyboardType ?? 'default'}
      />
    </View>
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#2f6f4f',
    borderColor: '#2f6f4f',
  },
  chipText: {
    fontSize: 13,
    color: '#333333',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  primaryButton: {
    marginTop: 8,
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
  retireButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  retireButtonText: {
    color: '#b00020',
    fontWeight: '600',
  },
});
