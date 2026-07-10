import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { Bike } from '../../../domain/types';
import { useBike, useCreateBike, useUpdateBike } from '../hooks/useBikes';

export default function AddEditBikeScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const { data: existingBike, isLoading: isLoadingBike } = useBike(id);

  if (isEditing && isLoadingBike) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Keyed by the loaded bike's id (or 'new') so the form's local state is initialized fresh
  // from `initialBike` on mount, instead of syncing it in via a useEffect.
  return <BikeForm key={existingBike?.id ?? 'new'} bikeId={id} initialBike={existingBike ?? null} />;
}

function BikeForm({ bikeId, initialBike }: { bikeId?: string; initialBike: Bike | null }) {
  const router = useRouter();
  const isEditing = Boolean(bikeId);
  const createBike = useCreateBike();
  const updateBike = useUpdateBike();

  const [name, setName] = useState(initialBike?.name ?? '');
  const [brand, setBrand] = useState(initialBike?.brand ?? '');
  const [model, setModel] = useState(initialBike?.model ?? '');
  const [year, setYear] = useState(initialBike?.year != null ? String(initialBike.year) : '');
  const [color, setColor] = useState(initialBike?.color ?? '');
  const [frameSize, setFrameSize] = useState(initialBike?.frameSize ?? '');
  const [startingOdometerKm, setStartingOdometerKm] = useState(
    initialBike ? String(initialBike.startingOdometerM / 1000) : '0'
  );
  const [photoUri, setPhotoUri] = useState<string | null>(initialBike?.photoUri ?? null);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Photo library access is required to add a bike photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give the bike a name before saving.');
      return;
    }

    const parsedYear = year.trim() ? Number(year) : null;
    const parsedOdometerKm = startingOdometerKm.trim() ? Number(startingOdometerKm) : 0;

    if (parsedYear != null && Number.isNaN(parsedYear)) {
      Alert.alert('Invalid year', 'Year must be a number.');
      return;
    }
    if (Number.isNaN(parsedOdometerKm)) {
      Alert.alert('Invalid odometer', 'Starting odometer must be a number.');
      return;
    }

    const values = {
      name: name.trim(),
      brand: brand.trim() || null,
      model: model.trim() || null,
      year: parsedYear,
      color: color.trim() || null,
      frameSize: frameSize.trim() || null,
      startingOdometerM: Math.round(parsedOdometerKm * 1000),
      photoUri,
    };

    if (isEditing && bikeId) {
      await updateBike.mutateAsync({ id: bikeId, changes: values });
      router.back();
    } else {
      const created = await createBike.mutateAsync(values);
      router.replace(`/bikes/${created.id}`);
    }
  };

  const saving = createBike.isPending || updateBike.isPending;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable style={styles.photoPicker} onPress={pickPhoto}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <Text style={styles.photoPlaceholder}>Add photo</Text>
        )}
      </Pressable>

      <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Trek FX 2" />
      <Field label="Brand" value={brand} onChangeText={setBrand} />
      <Field label="Model" value={model} onChangeText={setModel} />
      <Field label="Year" value={year} onChangeText={setYear} keyboardType="number-pad" />
      <Field label="Color" value={color} onChangeText={setColor} />
      <Field label="Frame size" value={frameSize} onChangeText={setFrameSize} />
      <Field
        label="Starting odometer (km)"
        value={startingOdometerKm}
        onChangeText={setStartingOdometerKm}
        keyboardType="decimal-pad"
      />

      <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={saving}>
        <Text style={styles.primaryButtonText}>
          {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Add bike'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
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
  content: {
    padding: 20,
  },
  photoPicker: {
    height: 160,
    borderRadius: 12,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    color: '#999999',
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
});
