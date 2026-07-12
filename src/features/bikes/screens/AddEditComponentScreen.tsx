import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { componentTypeValues, type Component, type ComponentType, type UnitSystem } from '../../../domain/types';
import type { ThemeColors } from '../../../theme/colors';
import { useTheme } from '../../../theme/useTheme';
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
        type: t(`componentType.${initialComponent.type}`),
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
            <Text style={[styles.chipText, type === value && styles.chipTextSelected]}>
              {t(`componentType.${value}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Field
        label={t('addEditComponent.nameLabel')}
        value={name}
        onChangeText={setName}
        placeholder={t('addEditComponent.namePlaceholder')}
        styles={styles}
      />
      <Field
        label={t('addEditComponent.installedAtOdometerLabel', { unit: distanceUnitLabel(unitSystem) })}
        value={installedAtOdometerDisplay}
        onChangeText={setInstalledAtOdometerDisplay}
        keyboardType="decimal-pad"
        styles={styles}
      />
      <Field
        label={t('addEditComponent.installedDateLabel')}
        value={installedDate}
        onChangeText={setInstalledDate}
        styles={styles}
      />
      <Field
        label={t('addEditComponent.expectedLifetimeLabel', { unit: distanceUnitLabel(unitSystem) })}
        value={expectedLifetimeDisplay}
        onChangeText={setExpectedLifetimeDisplay}
        keyboardType="decimal-pad"
        styles={styles}
      />
      <Field label={t('common.notesOptional')} value={notes} onChangeText={setNotes} styles={styles} />

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
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={props.styles.field}>
      <Text style={props.styles.label}>{props.label}</Text>
      <TextInput
        style={props.styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        keyboardType={props.keyboardType ?? 'default'}
      />
    </View>
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
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 16,
    },
    chip: {
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 8,
      marginBottom: 8,
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 13,
      color: colors.chipText,
    },
    chipTextSelected: {
      color: colors.onPrimary,
    },
    field: {
      marginBottom: 16,
    },
    label: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 4,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.text,
    },
    primaryButton: {
      marginTop: 8,
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
    retireButton: {
      marginTop: 12,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    retireButtonText: {
      color: colors.danger,
      fontWeight: '600',
    },
  });
}
