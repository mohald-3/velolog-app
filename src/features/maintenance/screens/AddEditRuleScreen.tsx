import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Chip, FormField, LoadingState } from '../../../components';
import { computeOdometerM } from '../../../domain/odometer';
import type { MaintenanceRule, UnitSystem } from '../../../domain/types';
import {
  distanceUnitLabel,
  distanceUnitToMeters,
  formatDistance,
  formatDistanceInput,
} from '../../../domain/units';
import type { ThemeColors } from '../../../theme/colors';
import { useTheme } from '../../../theme/useTheme';
import { useBike } from '../../bikes/hooks/useBikes';
import { useRides } from '../../rides/hooks/useRides';
import { useSettings } from '../../settings/hooks/useSettings';
import { useMarkRuleAsDone } from '../hooks/useMaintenanceRecords';
import {
  useArchiveMaintenanceRule,
  useCreateMaintenanceRule,
  useMaintenanceRule,
  useUpdateMaintenanceRule,
} from '../hooks/useMaintenanceRules';

const PRESETS = [
  { label: 'Lube chain', labelKey: 'addEditRule.presetLubeChain', action: 'Lubricate chain', intervalKm: 200 },
  { label: 'Replace chain', labelKey: 'addEditRule.presetReplaceChain', action: 'Replace chain', intervalKm: 3000 },
  {
    label: 'Check brake pads',
    labelKey: 'addEditRule.presetCheckBrakePads',
    action: 'Check brake pads',
    intervalKm: 1000,
  },
  { label: 'Custom', labelKey: 'addEditRule.presetCustom', action: '', intervalKm: null },
] as const;

export default function AddEditRuleScreen() {
  const { t } = useTranslation();
  const { id: bikeId, componentId, ruleId } = useLocalSearchParams<{
    id: string;
    componentId: string;
    ruleId?: string;
  }>();
  const isEditing = Boolean(ruleId);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { data: bike, isLoading: isLoadingBike } = useBike(bikeId);
  const { data: rides, isLoading: isLoadingRides } = useRides(bikeId);
  const { data: existingRule, isLoading: isLoadingRule } = useMaintenanceRule(ruleId);
  const { data: settings, isLoading: isLoadingSettings } = useSettings();

  if (isLoadingBike || isLoadingRides || (isEditing && isLoadingRule) || isLoadingSettings || !settings) {
    return <LoadingState />;
  }

  if (!bike) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>{t('common.bikeNotFound')}</Text>
      </View>
    );
  }

  const currentOdometerM = computeOdometerM(bike, rides ?? []);

  return (
    <RuleForm
      key={existingRule?.id ?? 'new'}
      componentId={componentId}
      currentOdometerM={currentOdometerM}
      initialRule={existingRule ?? null}
      unitSystem={settings.unitSystem}
    />
  );
}

function RuleForm({
  componentId,
  currentOdometerM,
  initialRule,
  unitSystem,
}: {
  componentId: string;
  currentOdometerM: number;
  initialRule: MaintenanceRule | null;
  unitSystem: UnitSystem;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isEditing = Boolean(initialRule);
  const createRule = useCreateMaintenanceRule();
  const updateRule = useUpdateMaintenanceRule();
  const archiveRule = useArchiveMaintenanceRule();
  const markAsDone = useMarkRuleAsDone();

  const [action, setAction] = useState(initialRule?.action ?? '');
  const [intervalDisplay, setIntervalDisplay] = useState(
    initialRule ? formatDistanceInput(initialRule.intervalM, unitSystem) : ''
  );
  const [lastPerformedDisplay, setLastPerformedDisplay] = useState(
    formatDistanceInput(initialRule?.lastPerformedAtOdometerM ?? currentOdometerM, unitSystem)
  );
  const [notes, setNotes] = useState(initialRule?.notes ?? '');

  const handleSubmit = () => {
    if (!action.trim()) {
      Alert.alert(t('addEditRule.actionRequiredTitle'), t('addEditRule.actionRequiredMessage'));
      return;
    }

    const parsedInterval = intervalDisplay.trim() ? Number(intervalDisplay) : NaN;
    const parsedLastPerformed = lastPerformedDisplay.trim() ? Number(lastPerformedDisplay) : NaN;

    if (Number.isNaN(parsedInterval) || parsedInterval <= 0) {
      Alert.alert(
        t('addEditRule.invalidIntervalTitle'),
        t('addEditRule.invalidIntervalMessage', { unit: distanceUnitLabel(unitSystem) })
      );
      return;
    }
    if (Number.isNaN(parsedLastPerformed)) {
      Alert.alert(t('addEditRule.invalidOdometerTitle'), t('addEditRule.invalidOdometerMessage'));
      return;
    }

    const values = {
      action: action.trim(),
      intervalM: Math.round(distanceUnitToMeters(parsedInterval, unitSystem)),
      lastPerformedAtOdometerM: Math.round(distanceUnitToMeters(parsedLastPerformed, unitSystem)),
      notes: notes.trim() || null,
    };

    if (isEditing && initialRule) {
      updateRule.mutate({ id: initialRule.id, changes: values }, { onSuccess: () => router.back() });
    } else {
      createRule.mutate({ componentId, ...values }, { onSuccess: () => router.back() });
    }
  };

  const handleMarkAsDone = () => {
    if (!initialRule) return;
    Alert.alert(
      t('addEditRule.markAsDoneConfirmTitle'),
      t('addEditRule.markAsDoneConfirmMessage', {
        action: initialRule.action,
        odometer: formatDistance(currentOdometerM, unitSystem, 1),
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('addEditRule.markAsDone'),
          onPress: () =>
            markAsDone.mutate({ rule: initialRule, currentOdometerM }, { onSuccess: () => router.back() }),
        },
      ]
    );
  };

  const handleArchive = () => {
    if (!initialRule) return;
    Alert.alert(
      t('addEditRule.removeConfirmTitle'),
      t('addEditRule.removeConfirmMessage', { action: initialRule.action }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('addEditRule.removeRule'),
          style: 'destructive',
          onPress: () =>
            archiveRule.mutate({ id: initialRule.id, componentId }, { onSuccess: () => router.back() }),
        },
      ]
    );
  };

  const saving = createRule.isPending || updateRule.isPending;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      <Stack.Screen options={{ title: t(isEditing ? 'addEditRule.editTitle' : 'addEditRule.addTitle') }} />
      {isEditing && (
        <Button
          title={markAsDone.isPending ? t('common.saving') : t('addEditRule.markAsDone')}
          onPress={handleMarkAsDone}
          disabled={markAsDone.isPending}
          style={styles.markDoneButton}
        />
      )}

      {!isEditing && (
        <>
          <Text style={styles.label}>{t('addEditRule.presetLabel')}</Text>
          <View style={styles.chipRow}>
            {PRESETS.map((preset) => (
              <Chip
                key={preset.label}
                label={t(preset.labelKey)}
                onPress={() => {
                  setAction(preset.action);
                  if (preset.intervalKm != null) {
                    setIntervalDisplay(formatDistanceInput(preset.intervalKm * 1000, unitSystem));
                  }
                }}
              />
            ))}
          </View>
        </>
      )}

      <FormField
        label={t('addEditRule.actionLabel')}
        value={action}
        onChangeText={setAction}
        placeholder={t('addEditRule.actionPlaceholder')}
      />
      <FormField
        label={t('addEditRule.intervalLabel', { unit: distanceUnitLabel(unitSystem) })}
        value={intervalDisplay}
        onChangeText={setIntervalDisplay}
        keyboardType="decimal-pad"
      />
      <FormField
        label={t('addEditRule.lastPerformedLabel', { unit: distanceUnitLabel(unitSystem) })}
        value={lastPerformedDisplay}
        onChangeText={setLastPerformedDisplay}
        keyboardType="decimal-pad"
      />
      <FormField label={t('common.notesOptional')} value={notes} onChangeText={setNotes} />

      <Button
        title={saving ? t('common.saving') : isEditing ? t('common.saveChanges') : t('addEditRule.addRule')}
        onPress={handleSubmit}
        disabled={saving}
        style={styles.submitButton}
      />

      {isEditing && (
        <Button
          title={t('addEditRule.removeRule')}
          onPress={handleArchive}
          variant="ghostDanger"
          style={styles.archiveButton}
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
    markDoneButton: {
      marginBottom: 20,
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
    archiveButton: {
      marginTop: 12,
    },
  });
}
