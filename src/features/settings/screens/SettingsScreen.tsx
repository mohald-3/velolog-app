import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Locale, UnitSystem } from '../../../domain/types';
import { useSettings, useUpdateSettings } from '../hooks/useSettings';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  if (isLoading || !settings) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      <Stack.Screen options={{ title: t('settings.headerTitle') }} />

      <Text style={styles.sectionTitle}>{t('settings.unitsSection')}</Text>
      <OptionRow
        label={t('settings.unitsMetric')}
        selected={settings.unitSystem === 'metric'}
        onPress={() => updateSettings.mutate({ unitSystem: 'metric' as UnitSystem })}
      />
      <OptionRow
        label={t('settings.unitsImperial')}
        selected={settings.unitSystem === 'imperial'}
        onPress={() => updateSettings.mutate({ unitSystem: 'imperial' as UnitSystem })}
      />

      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>{t('settings.languageSection')}</Text>
      <OptionRow
        label={t('settings.languageEnglish')}
        selected={settings.locale === 'en'}
        onPress={() => updateSettings.mutate({ locale: 'en' as Locale })}
      />
      <OptionRow
        label={t('settings.languageSwedish')}
        selected={settings.locale === 'sv'}
        onPress={() => updateSettings.mutate({ locale: 'sv' as Locale })}
      />
    </View>
  );
}

function OptionRow({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      {selected && <View style={styles.selectedDot} />}
    </Pressable>
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888888',
    marginBottom: 8,
  },
  sectionSpacing: {
    marginTop: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  selectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2f6f4f',
  },
});
