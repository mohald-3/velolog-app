import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { computeOdometerM } from '../../../domain/odometer';
import type { MaintenanceRule, UnitSystem } from '../../../domain/types';
import { distanceUnitLabel, distanceUnitToMeters, formatDistance, metersToDistanceUnit } from '../../../domain/units';
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
  const [intervalKm, setIntervalKm] = useState(
    initialRule ? String(metersToDistanceUnit(initialRule.intervalM, unitSystem)) : ''
  );
  const [lastPerformedAtOdometerKm, setLastPerformedAtOdometerKm] = useState(
    String(metersToDistanceUnit(initialRule?.lastPerformedAtOdometerM ?? currentOdometerM, unitSystem))
  );
  const [notes, setNotes] = useState(initialRule?.notes ?? '');

  const handleSubmit = async () => {
    if (!action.trim()) {
      Alert.alert(t('addEditRule.actionRequiredTitle'), t('addEditRule.actionRequiredMessage'));
      return;
    }

    const parsedIntervalKm = intervalKm.trim() ? Number(intervalKm) : NaN;
    const parsedLastPerformedKm = lastPerformedAtOdometerKm.trim() ? Number(lastPerformedAtOdometerKm) : NaN;

    if (Number.isNaN(parsedIntervalKm) || parsedIntervalKm <= 0) {
      Alert.alert(
        t('addEditRule.invalidIntervalTitle'),
        t('addEditRule.invalidIntervalMessage', { unit: distanceUnitLabel(unitSystem) })
      );
      return;
    }
    if (Number.isNaN(parsedLastPerformedKm)) {
      Alert.alert(t('addEditRule.invalidOdometerTitle'), t('addEditRule.invalidOdometerMessage'));
      return;
    }

    const values = {
      action: action.trim(),
      intervalM: Math.round(distanceUnitToMeters(parsedIntervalKm, unitSystem)),
      lastPerformedAtOdometerM: Math.round(distanceUnitToMeters(parsedLastPerformedKm, unitSystem)),
      notes: notes.trim() || null,
    };

    if (isEditing && initialRule) {
      await updateRule.mutateAsync({ id: initialRule.id, changes: values });
    } else {
      await createRule.mutateAsync({ componentId, ...values });
    }
    router.back();
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
          onPress: async () => {
            await markAsDone.mutateAsync({ rule: initialRule, currentOdometerM });
            router.back();
          },
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
          onPress: async () => {
            await archiveRule.mutateAsync({ id: initialRule.id, componentId });
            router.back();
          },
        },
      ]
    );
  };

  const saving = createRule.isPending || updateRule.isPending;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      {isEditing && (
        <Pressable
          style={styles.markDoneButton}
          onPress={handleMarkAsDone}
          disabled={markAsDone.isPending}
        >
          <Text style={styles.markDoneButtonText}>
            {markAsDone.isPending ? t('common.saving') : t('addEditRule.markAsDone')}
          </Text>
        </Pressable>
      )}

      {!isEditing && (
        <>
          <Text style={styles.label}>{t('addEditRule.presetLabel')}</Text>
          <View style={styles.chipRow}>
            {PRESETS.map((preset) => (
              <Pressable
                key={preset.label}
                style={styles.chip}
                onPress={() => {
                  setAction(preset.action);
                  if (preset.intervalKm != null) {
                    setIntervalKm(String(metersToDistanceUnit(preset.intervalKm * 1000, unitSystem)));
                  }
                }}
              >
                <Text style={styles.chipText}>{t(preset.labelKey)}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Field
        label={t('addEditRule.actionLabel')}
        value={action}
        onChangeText={setAction}
        placeholder={t('addEditRule.actionPlaceholder')}
        styles={styles}
        placeholderTextColor={colors.textDisabled}
      />
      <Field
        label={t('addEditRule.intervalLabel', { unit: distanceUnitLabel(unitSystem) })}
        value={intervalKm}
        onChangeText={setIntervalKm}
        keyboardType="decimal-pad"
        styles={styles}
        placeholderTextColor={colors.textDisabled}
      />
      <Field
        label={t('addEditRule.lastPerformedLabel', { unit: distanceUnitLabel(unitSystem) })}
        value={lastPerformedAtOdometerKm}
        onChangeText={setLastPerformedAtOdometerKm}
        keyboardType="decimal-pad"
        styles={styles}
        placeholderTextColor={colors.textDisabled}
      />
      <Field
        label={t('common.notesOptional')}
        value={notes}
        onChangeText={setNotes}
        styles={styles}
        placeholderTextColor={colors.textDisabled}
      />

      <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={saving}>
        <Text style={styles.primaryButtonText}>
          {saving ? t('common.saving') : isEditing ? t('common.saveChanges') : t('addEditRule.addRule')}
        </Text>
      </Pressable>

      {isEditing && (
        <Pressable style={styles.archiveButton} onPress={handleArchive}>
          <Text style={styles.archiveButtonText}>{t('addEditRule.removeRule')}</Text>
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
  placeholderTextColor?: string;
}) {
  return (
    <View style={props.styles.field}>
      <Text style={props.styles.label}>{props.label}</Text>
      <TextInput
        style={props.styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={props.placeholderTextColor}
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
    markDoneButton: {
      marginBottom: 20,
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    markDoneButtonText: {
      color: colors.onPrimary,
      fontWeight: '600',
      fontSize: 16,
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
    chipText: {
      fontSize: 13,
      color: colors.chipText,
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
