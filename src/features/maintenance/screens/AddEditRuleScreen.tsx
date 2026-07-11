import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { computeOdometerM } from '../../../domain/odometer';
import type { MaintenanceRule } from '../../../domain/types';
import { useBike } from '../../bikes/hooks/useBikes';
import { useRides } from '../../rides/hooks/useRides';
import {
  useArchiveMaintenanceRule,
  useCreateMaintenanceRule,
  useMaintenanceRule,
  useUpdateMaintenanceRule,
} from '../hooks/useMaintenanceRules';

const PRESETS = [
  { label: 'Lube chain', action: 'Lubricate chain', intervalKm: 200 },
  { label: 'Replace chain', action: 'Replace chain', intervalKm: 3000 },
  { label: 'Check brake pads', action: 'Check brake pads', intervalKm: 1000 },
  { label: 'Custom', action: '', intervalKm: null },
] as const;

export default function AddEditRuleScreen() {
  const { id: bikeId, componentId, ruleId } = useLocalSearchParams<{
    id: string;
    componentId: string;
    ruleId?: string;
  }>();
  const isEditing = Boolean(ruleId);

  const { data: bike, isLoading: isLoadingBike } = useBike(bikeId);
  const { data: rides, isLoading: isLoadingRides } = useRides(bikeId);
  const { data: existingRule, isLoading: isLoadingRule } = useMaintenanceRule(ruleId);

  if (isLoadingBike || isLoadingRides || (isEditing && isLoadingRule)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!bike) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Bike not found.</Text>
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
    />
  );
}

function RuleForm({
  componentId,
  currentOdometerM,
  initialRule,
}: {
  componentId: string;
  currentOdometerM: number;
  initialRule: MaintenanceRule | null;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isEditing = Boolean(initialRule);
  const createRule = useCreateMaintenanceRule();
  const updateRule = useUpdateMaintenanceRule();
  const archiveRule = useArchiveMaintenanceRule();

  const [action, setAction] = useState(initialRule?.action ?? '');
  const [intervalKm, setIntervalKm] = useState(initialRule ? String(initialRule.intervalM / 1000) : '');
  const [lastPerformedAtOdometerKm, setLastPerformedAtOdometerKm] = useState(
    String((initialRule?.lastPerformedAtOdometerM ?? currentOdometerM) / 1000)
  );
  const [notes, setNotes] = useState(initialRule?.notes ?? '');

  const handleSubmit = async () => {
    if (!action.trim()) {
      Alert.alert('Action required', 'Give the rule an action, e.g. "Lubricate chain".');
      return;
    }

    const parsedIntervalKm = intervalKm.trim() ? Number(intervalKm) : NaN;
    const parsedLastPerformedKm = lastPerformedAtOdometerKm.trim() ? Number(lastPerformedAtOdometerKm) : NaN;

    if (Number.isNaN(parsedIntervalKm) || parsedIntervalKm <= 0) {
      Alert.alert('Invalid interval', 'Interval must be a positive number of km.');
      return;
    }
    if (Number.isNaN(parsedLastPerformedKm)) {
      Alert.alert('Invalid odometer', 'Last performed odometer must be a number.');
      return;
    }

    const values = {
      action: action.trim(),
      intervalM: Math.round(parsedIntervalKm * 1000),
      lastPerformedAtOdometerM: Math.round(parsedLastPerformedKm * 1000),
      notes: notes.trim() || null,
    };

    if (isEditing && initialRule) {
      await updateRule.mutateAsync({ id: initialRule.id, changes: values });
    } else {
      await createRule.mutateAsync({ componentId, ...values });
    }
    router.back();
  };

  const handleArchive = () => {
    if (!initialRule) return;
    Alert.alert('Remove this rule?', `"${initialRule.action}" will stop being tracked.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await archiveRule.mutateAsync({ id: initialRule.id, componentId });
          router.back();
        },
      },
    ]);
  };

  const saving = createRule.isPending || updateRule.isPending;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      {!isEditing && (
        <>
          <Text style={styles.label}>Preset</Text>
          <View style={styles.chipRow}>
            {PRESETS.map((preset) => (
              <Pressable
                key={preset.label}
                style={styles.chip}
                onPress={() => {
                  setAction(preset.action);
                  if (preset.intervalKm != null) setIntervalKm(String(preset.intervalKm));
                }}
              >
                <Text style={styles.chipText}>{preset.label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Field label="Action" value={action} onChangeText={setAction} placeholder="e.g. Lubricate chain" />
      <Field
        label="Interval (km)"
        value={intervalKm}
        onChangeText={setIntervalKm}
        keyboardType="decimal-pad"
      />
      <Field
        label="Last performed at odometer (km)"
        value={lastPerformedAtOdometerKm}
        onChangeText={setLastPerformedAtOdometerKm}
        keyboardType="decimal-pad"
      />
      <Field label="Notes (optional)" value={notes} onChangeText={setNotes} />

      <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={saving}>
        <Text style={styles.primaryButtonText}>
          {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Add rule'}
        </Text>
      </Pressable>

      {isEditing && (
        <Pressable style={styles.archiveButton} onPress={handleArchive}>
          <Text style={styles.archiveButtonText}>Remove rule</Text>
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
  chipText: {
    fontSize: 13,
    color: '#333333',
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
