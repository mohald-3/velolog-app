import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, FormField, LoadingState } from '../../../components';
import type { Bike } from '../../../domain/types';
import { distanceUnitLabel, distanceUnitToMeters, metersToDistanceUnit } from '../../../domain/units';
import type { ThemeColors } from '../../../theme/colors';
import { useTheme } from '../../../theme/useTheme';
import { useSettings } from '../../settings/hooks/useSettings';
import { useBike, useCreateBike, useUpdateBike } from '../hooks/useBikes';

export default function AddEditBikeScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const { data: existingBike, isLoading: isLoadingBike } = useBike(id);
  const { data: settings, isLoading: isLoadingSettings } = useSettings();

  if ((isEditing && isLoadingBike) || isLoadingSettings || !settings) {
    return <LoadingState />;
  }

  // Keyed by the loaded bike's id (or 'new') so the form's local state is initialized fresh
  // from `initialBike` on mount, instead of syncing it in via a useEffect.
  return (
    <BikeForm
      key={existingBike?.id ?? 'new'}
      bikeId={id}
      initialBike={existingBike ?? null}
      unitSystem={settings.unitSystem}
    />
  );
}

function BikeForm({
  bikeId,
  initialBike,
  unitSystem,
}: {
  bikeId?: string;
  initialBike: Bike | null;
  unitSystem: 'metric' | 'imperial';
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isEditing = Boolean(bikeId);
  const createBike = useCreateBike();
  const updateBike = useUpdateBike();

  const [name, setName] = useState(initialBike?.name ?? '');
  const [brand, setBrand] = useState(initialBike?.brand ?? '');
  const [model, setModel] = useState(initialBike?.model ?? '');
  const [year, setYear] = useState(initialBike?.year != null ? String(initialBike.year) : '');
  const [color, setColor] = useState(initialBike?.color ?? '');
  const [frameSize, setFrameSize] = useState(initialBike?.frameSize ?? '');
  const [startingOdometer, setStartingOdometer] = useState(
    initialBike ? String(metersToDistanceUnit(initialBike.startingOdometerM, unitSystem)) : '0'
  );
  const [photoUri, setPhotoUri] = useState<string | null>(initialBike?.photoUri ?? null);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('addEditBike.permissionNeededTitle'), t('addEditBike.permissionNeededMessage'));
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

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert(t('addEditBike.nameRequiredTitle'), t('addEditBike.nameRequiredMessage'));
      return;
    }

    const parsedYear = year.trim() ? Number(year) : null;
    const parsedOdometer = startingOdometer.trim() ? Number(startingOdometer) : 0;

    if (parsedYear != null && Number.isNaN(parsedYear)) {
      Alert.alert(t('addEditBike.invalidYearTitle'), t('addEditBike.invalidYearMessage'));
      return;
    }
    if (Number.isNaN(parsedOdometer)) {
      Alert.alert(t('addEditBike.invalidOdometerTitle'), t('addEditBike.invalidOdometerMessage'));
      return;
    }

    const values = {
      name: name.trim(),
      brand: brand.trim() || null,
      model: model.trim() || null,
      year: parsedYear,
      color: color.trim() || null,
      frameSize: frameSize.trim() || null,
      startingOdometerM: Math.round(distanceUnitToMeters(parsedOdometer, unitSystem)),
      photoUri,
    };

    if (isEditing && bikeId) {
      updateBike.mutate({ id: bikeId, changes: values }, { onSuccess: () => router.back() });
    } else {
      createBike.mutate(values, { onSuccess: (created) => router.replace(`/bikes/${created.id}`) });
    }
  };

  const saving = createBike.isPending || updateBike.isPending;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      <Pressable style={styles.photoPicker} onPress={pickPhoto}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <Text style={styles.photoPlaceholder}>{t('addEditBike.addPhoto')}</Text>
        )}
      </Pressable>

      <FormField
        label={t('addEditBike.nameLabel')}
        value={name}
        onChangeText={setName}
        placeholder={t('addEditBike.namePlaceholder')}
      />
      <FormField label={t('addEditBike.brandLabel')} value={brand} onChangeText={setBrand} />
      <FormField label={t('addEditBike.modelLabel')} value={model} onChangeText={setModel} />
      <FormField
        label={t('addEditBike.yearLabel')}
        value={year}
        onChangeText={setYear}
        keyboardType="number-pad"
      />
      <FormField label={t('addEditBike.colorLabel')} value={color} onChangeText={setColor} />
      <FormField label={t('addEditBike.frameSizeLabel')} value={frameSize} onChangeText={setFrameSize} />
      <FormField
        label={t('addEditBike.startingOdometerLabel', { unit: distanceUnitLabel(unitSystem) })}
        value={startingOdometer}
        onChangeText={setStartingOdometer}
        keyboardType="decimal-pad"
      />

      <Button
        title={saving ? t('common.saving') : isEditing ? t('common.saveChanges') : t('addEditBike.addBike')}
        onPress={handleSubmit}
        disabled={saving}
        style={styles.submitButton}
      />
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      padding: 20,
      backgroundColor: colors.background,
    },
    photoPicker: {
      height: 160,
      borderRadius: 12,
      backgroundColor: colors.surface,
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
      color: colors.textDisabled,
    },
    submitButton: {
      marginTop: 8,
    },
  });
}
