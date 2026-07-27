import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Chip, FormField, LoadingState, OverflowMenu } from '../../../components';
import { componentTypeValues, type Component, type ComponentType, type UnitSystem } from '../../../domain/types';
import type { ThemeColors } from '../../../theme/colors';
import { useTheme } from '../../../theme/useTheme';
import { computeOdometerM } from '../../../domain/odometer';
import {
  distanceUnitLabel,
  distanceUnitToMeters,
  formatDistance,
  formatDistanceInput,
} from '../../../domain/units';
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
    return <LoadingState />;
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
    formatDistanceInput(initialComponent?.installedAtOdometerM ?? currentOdometerM, unitSystem)
  );
  const [installedDate, setInstalledDate] = useState(
    toDateInputValue(initialComponent?.installedDate ?? new Date())
  );
  const [expectedLifetimeDisplay, setExpectedLifetimeDisplay] = useState(
    initialComponent?.expectedLifetimeM != null
      ? formatDistanceInput(initialComponent.expectedLifetimeM, unitSystem)
      : ''
  );
  const [notes, setNotes] = useState(initialComponent?.notes ?? '');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSubmit = () => {
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
      expectedLifetimeM:
        parsedLifetimeDisplay != null ? Math.round(distanceUnitToMeters(parsedLifetimeDisplay, unitSystem)) : null,
      notes: notes.trim() || null,
    };

    if (isEditing && initialComponent) {
      updateComponent.mutate({ id: initialComponent.id, changes: values }, { onSuccess: () => router.back() });
    } else {
      createComponent.mutate({ bikeId, ...values }, { onSuccess: () => router.back() });
    }
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
          onPress: () =>
            replaceComponent.mutate(
              { oldComponent: initialComponent, currentOdometerM },
              { onSuccess: () => router.back() }
            ),
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
          onPress: () =>
            retireComponent.mutate({ id: initialComponent.id, bikeId }, { onSuccess: () => router.back() }),
        },
      ]
    );
  };

  const saving = createComponent.isPending || updateComponent.isPending;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      <Stack.Screen
        options={{
          title: t(isEditing ? 'addEditComponent.editTitle' : 'addEditComponent.addTitle'),
          headerRight: isEditing
            ? () => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.moreActions')}
                  hitSlop={12}
                  style={styles.headerButton}
                  onPress={() => setMenuOpen(true)}
                >
                  <Ionicons name="ellipsis-vertical" size={22} color={colors.primary} />
                </Pressable>
              )
            : undefined,
        }}
      />
      <OverflowMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={[
          {
            label: replaceComponent.isPending
              ? t('addEditComponent.replacing')
              : t('addEditComponent.replaceComponent'),
            icon: 'swap-horizontal-outline',
            disabled: replaceComponent.isPending || retireComponent.isPending,
            onPress: handleReplace,
          },
          {
            label: t('addEditComponent.retireComponent'),
            icon: 'archive-outline',
            destructive: true,
            disabled: replaceComponent.isPending || retireComponent.isPending,
            onPress: handleRetire,
          },
        ]}
      />
      <Text style={styles.label}>{t('addEditComponent.typeLabel')}</Text>
      <View style={styles.chipRow}>
        {componentTypeValues.map((value) => (
          <Chip
            key={value}
            label={t(`componentType.${value}`)}
            selected={type === value}
            onPress={() => setType(value)}
          />
        ))}
      </View>

      <FormField
        label={t('addEditComponent.nameLabel')}
        value={name}
        onChangeText={setName}
        placeholder={t('addEditComponent.namePlaceholder')}
      />
      <FormField
        label={t('addEditComponent.installedAtOdometerLabel', { unit: distanceUnitLabel(unitSystem) })}
        value={installedAtOdometerDisplay}
        onChangeText={setInstalledAtOdometerDisplay}
        keyboardType="decimal-pad"
      />
      <FormField
        label={t('addEditComponent.installedDateLabel')}
        value={installedDate}
        onChangeText={setInstalledDate}
      />
      <FormField
        label={t('addEditComponent.expectedLifetimeLabel', { unit: distanceUnitLabel(unitSystem) })}
        value={expectedLifetimeDisplay}
        onChangeText={setExpectedLifetimeDisplay}
        keyboardType="decimal-pad"
      />
      <FormField label={t('common.notesOptional')} value={notes} onChangeText={setNotes} />

      <Button
        title={saving ? t('common.saving') : isEditing ? t('common.saveChanges') : t('addEditComponent.addComponent')}
        onPress={handleSubmit}
        disabled={saving}
        style={styles.submitButton}
      />

      {isEditing && initialComponent && (
        <Button
          title={`${t('addEditComponent.maintenanceRules')}${rules && rules.length > 0 ? ` (${rules.length})` : ''}`}
          onPress={() => router.push(`/bikes/${bikeId}/components/${initialComponent.id}/rules`)}
          variant="secondary"
          style={styles.stackedButton}
        />
      )}

      {isEditing && initialComponent && (
        <Button
          title={t('addEditComponent.maintenanceLog')}
          onPress={() => router.push(`/bikes/${bikeId}/components/${initialComponent.id}/log`)}
          variant="secondary"
          style={styles.stackedButton}
        />
      )}

    </ScrollView>
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
    label: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 4,
    },
    submitButton: {
      marginTop: 8,
    },
    stackedButton: {
      marginTop: 12,
    },
    headerButton: {
      marginRight: 16,
    },
  });
}
