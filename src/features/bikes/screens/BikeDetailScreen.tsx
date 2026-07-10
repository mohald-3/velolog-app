import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useArchiveBike, useBike } from '../hooks/useBikes';

export default function BikeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: bike, isLoading } = useBike(id);
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
      {bike.photoUri && <Image source={{ uri: bike.photoUri }} style={styles.photo} />}

      <Text style={styles.title}>{bike.name}</Text>
      {(bike.brand || bike.model) && (
        <Text style={styles.subtitle}>{[bike.brand, bike.model].filter(Boolean).join(' ')}</Text>
      )}

      <View style={styles.card}>
        <Row label="Odometer" value={`${(bike.startingOdometerM / 1000).toFixed(1)} km`} />
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

      <Pressable style={styles.primaryButton} onPress={() => router.push(`/bikes/${bike.id}/edit`)}>
        <Text style={styles.primaryButtonText}>Edit</Text>
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
