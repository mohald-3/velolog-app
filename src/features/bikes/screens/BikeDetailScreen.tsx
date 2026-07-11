import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Component } from '../../../domain/types';
import { computeOdometerM } from '../../../domain/odometer';
import { computeComponentWearM } from '../../../domain/wear';
import { useRides } from '../../rides/hooks/useRides';
import { useArchiveBike, useBike } from '../hooks/useBikes';
import { useComponents } from '../hooks/useComponents';

export default function BikeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: bike, isLoading } = useBike(id);
  const { data: components } = useComponents(id);
  const { data: rides } = useRides(id);
  const archiveBike = useArchiveBike();

  if (isLoading) {
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

  const handleArchive = () => {
    Alert.alert('Archive this bike?', `${bike.name} will be hidden from your active garage.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          await archiveBike.mutateAsync(bike.id);
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: bike.name }} />
      {bike.photoUri && <Image source={{ uri: bike.photoUri }} style={styles.photo} />}

      <Text style={styles.title}>{bike.name}</Text>
      {(bike.brand || bike.model) && (
        <Text style={styles.subtitle}>{[bike.brand, bike.model].filter(Boolean).join(' ')}</Text>
      )}

      <View style={styles.card}>
        <Row label="Odometer" value={`${(currentOdometerM / 1000).toFixed(1)} km`} />
        {bike.year != null && <Row label="Year" value={String(bike.year)} />}
        {bike.color && <Row label="Color" value={bike.color} />}
        {bike.frameSize && <Row label="Frame size" value={bike.frameSize} />}
      </View>

      {bike.notes && (
        <View style={styles.card}>
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.notes}>{bike.notes}</Text>
        </View>
      )}

      <View style={styles.componentsHeader}>
        <Text style={styles.sectionTitle}>Components</Text>
        <Pressable onPress={() => router.push(`/bikes/${bike.id}/components/new`)}>
          <Text style={styles.addComponentLink}>+ Add</Text>
        </Pressable>
      </View>

      {!components || components.length === 0 ? (
        <Text style={styles.emptyComponents}>
          No components yet — add your chain, tires, or brake pads to start tracking wear.
        </Text>
      ) : (
        components.map((component) => (
          <ComponentRow key={component.id} bikeId={bike.id} component={component} currentOdometerM={currentOdometerM} />
        ))
      )}

      <Pressable style={styles.primaryButton} onPress={() => router.push(`/bikes/${bike.id}/record`)}>
        <Text style={styles.primaryButtonText}>Start a Ride</Text>
      </Pressable>

      <Pressable style={styles.editButton} onPress={() => router.push(`/bikes/${bike.id}/edit`)}>
        <Text style={styles.editButtonText}>Edit</Text>
      </Pressable>
      <Pressable style={styles.archiveButton} onPress={handleArchive}>
        <Text style={styles.archiveButtonText}>Archive bike</Text>
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
}: {
  bikeId: string;
  component: Component;
  currentOdometerM: number;
}) {
  const router = useRouter();
  const wearKm = computeComponentWearM(currentOdometerM, component.installedAtOdometerM) / 1000;

  return (
    <Pressable
      style={styles.componentRow}
      onPress={() => router.push(`/bikes/${bikeId}/components/${component.id}/edit`)}
    >
      <View>
        <Text style={styles.componentName}>{component.name}</Text>
        <Text style={styles.componentType}>{component.type}</Text>
      </View>
      <Text style={styles.componentWear}>{wearKm.toFixed(0)} km</Text>
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
  componentName: {
    fontSize: 15,
    fontWeight: '600',
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
  editButton: {
    marginTop: 12,
    backgroundColor: '#f2f2f2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
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
