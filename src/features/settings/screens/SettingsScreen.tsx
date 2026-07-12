import { Stack } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Locale, ThemeMode, UnitSystem } from '../../../domain/types';
import type { ThemeColors } from '../../../theme/colors';
import { useTheme } from '../../../theme/useTheme';
import { useSettings, useUpdateSettings } from '../hooks/useSettings';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
        styles={styles}
      />
      <OptionRow
        label={t('settings.unitsImperial')}
        selected={settings.unitSystem === 'imperial'}
        onPress={() => updateSettings.mutate({ unitSystem: 'imperial' as UnitSystem })}
        styles={styles}
      />

      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>{t('settings.languageSection')}</Text>
      <OptionRow
        label={t('settings.languageEnglish')}
        selected={settings.locale === 'en'}
        onPress={() => updateSettings.mutate({ locale: 'en' as Locale })}
        styles={styles}
      />
      <OptionRow
        label={t('settings.languageSwedish')}
        selected={settings.locale === 'sv'}
        onPress={() => updateSettings.mutate({ locale: 'sv' as Locale })}
        styles={styles}
      />

      <Text style={[styles.sectionTitle, styles.sectionSpacing]}>{t('settings.themeSection')}</Text>
      <OptionRow
        label={t('settings.themeSystem')}
        selected={settings.themeMode === 'system'}
        onPress={() => updateSettings.mutate({ themeMode: 'system' as ThemeMode })}
        styles={styles}
      />
      <OptionRow
        label={t('settings.themeLight')}
        selected={settings.themeMode === 'light'}
        onPress={() => updateSettings.mutate({ themeMode: 'light' as ThemeMode })}
        styles={styles}
      />
      <OptionRow
        label={t('settings.themeDark')}
        selected={settings.themeMode === 'dark'}
        onPress={() => updateSettings.mutate({ themeMode: 'dark' as ThemeMode })}
        styles={styles}
      />
    </View>
  );
}

function OptionRow({
  label,
  selected,
  onPress,
  styles,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      {selected && <View style={styles.selectedDot} />}
    </Pressable>
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
    content: {
      flex: 1,
      padding: 20,
      backgroundColor: colors.background,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textMuted,
      marginBottom: 8,
    },
    sectionSpacing: {
      marginTop: 24,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 10,
      padding: 14,
      marginTop: 8,
    },
    rowLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    selectedDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
  });
}
