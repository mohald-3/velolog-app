import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Component, ComponentType } from '../../../domain/types';
import { componentTypeValues } from '../../../data/schema';
import { computeOdometerM } from '../../../domain/odometer';
import { useMaintenanceRules } from '../../maintenance/hooks/useMaintenanceRules';
import { useRides } from '../../rides/hooks/useRides';
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

  if (isLoadingBike || isLoadingRides || (isEditing && isLoadingComponent)) {
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

  return (
    <ComponentForm
      key={existingComponent?.id ?? 'new'}
      bikeId={bikeId}
      currentOdometerM={computeOdometerM(bike, rides ?? [])}
      initialComponent={existingComponent ?? null}
    />
  );
}

function ComponentForm({
  bikeId,
  currentOdometerM,
  initialComponent,
}: {
  bikeId: string;
  currentOdometerM: number;
  initialComponent: Component | null;
}) {
  const router = useRouter();
  const { data: rules } = useMaintenanceRules(initialComponent?.id);
  const insets = useSafeAreaInsets();
  const isEditing = Boolean(initialComponent);
  const createComponent = useCreateComponent();
  const updateComponent = useUpdateComponent();
  const retireComponent = useRetireComponent();
  const replaceComponent = useReplaceComponent();

  const [type, setType] = useState<ComponentType>(initialComponent?.type ?? 'Chain');
  const [name, setName] = useState(initialComponent?.name ?? '');
  const [installedAtOdometerKm, setInstalledAtOdometerKm] = useState(
    String((initialComponent?.installedAtOdometerM ?? currentOdometerM) / 1000)
  );
  const [installedDate, setInstalledDate] = useState(
    toDateInputValue(initialComponent?.installedDate ?? new Date())
  );
  const [expectedLifetimeKm, setExpectedLifetimeKm] = useState(
    initialComponent?.expectedLifetimeKm != null ? String(initialComponent.expectedLifetimeKm) : ''
  );
  const [notes, setNotes] = useState(initialComponent?.notes ?? '');

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give the component a name before saving.');
      return;
    }

    const parsedOdometerKm = installedAtOdometerKm.trim() ? Number(installedAtOdometerKm) : NaN;
    const parsedDate = new Date(installedDate);
    const parsedLifetimeKm = expectedLifetimeKm.trim() ? Number(expectedLifetimeKm) : null;

    if (Number.isNaN(parsedOdometerKm)) {
      Alert.alert('Invalid odometer', 'Installed-at odometer must be a number.');
      return;
    }
    if (Number.isNaN(parsedDate.getTime())) {
      Alert.alert('Invalid date', 'Installed date must be in YYYY-MM-DD format.');
      return;
    }
    if (parsedLifetimeKm != null && Number.isNaN(parsedLifetimeKm)) {
      Alert.alert('Invalid lifetime', 'Expected lifetime must be a number.');
      return;
    }

    const values = {
      type,
      name: name.trim(),
      installedAtOdometerM: Math.round(parsedOdometerKm * 1000),
      installedDate: parsedDate,
      expectedLifetimeKm: parsedLifetimeKm,
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
      'Replace this component?',
      `${initialComponent.name} will be retired and a new ${initialComponent.type} installed at ${(currentOdometerM / 1000).toFixed(1)} km. Active maintenance rules move to the new component with their counter reset.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace',
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
    Alert.alert('Retire this component?', `${initialComponent.name} will be marked as retired.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Retire',
        style: 'destructive',
        onPress: async () => {
          await retireComponent.mutateAsync({ id: initialComponent.id, bikeId });
          router.back();
        },
      },
    ]);
  };

  const saving = createComponent.isPending || updateComponent.isPending;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      <Text style={styles.label}>Type</Text>
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

      <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Chain" />
      <Field
        label="Installed at odometer (km)"
        value={installedAtOdometerKm}
        onChangeText={setInstalledAtOdometerKm}
        keyboardType="decimal-pad"
      />
      <Field
        label="Installed date (YYYY-MM-DD)"
        value={installedDate}
        onChangeText={setInstalledDate}
      />
      <Field
        label="Expected lifetime (km, optional)"
        value={expectedLifetimeKm}
        onChangeText={setExpectedLifetimeKm}
        keyboardType="decimal-pad"
      />
      <Field label="Notes (optional)" value={notes} onChangeText={setNotes} />

      <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={saving}>
        <Text style={styles.primaryButtonText}>
          {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Add component'}
        </Text>
      </Pressable>

      {isEditing && initialComponent && (
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push(`/bikes/${bikeId}/components/${initialComponent.id}/rules`)}
        >
          <Text style={styles.secondaryButtonText}>
            Maintenance Rules{rules && rules.length > 0 ? ` (${rules.length})` : ''}
          </Text>
        </Pressable>
      )}

      {isEditing && initialComponent && (
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push(`/bikes/${bikeId}/components/${initialComponent.id}/log`)}
        >
          <Text style={styles.secondaryButtonText}>Maintenance Log</Text>
        </Pressable>
      )}

      {isEditing && (
        <Pressable style={styles.secondaryButton} onPress={handleReplace} disabled={replaceComponent.isPending}>
          <Text style={styles.secondaryButtonText}>
            {replaceComponent.isPending ? 'Replacing...' : 'Replace component'}
          </Text>
        </Pressable>
      )}

      {isEditing && (
        <Pressable style={styles.retireButton} onPress={handleRetire}>
          <Text style={styles.retireButtonText}>Retire component</Text>
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
