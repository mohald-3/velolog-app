import { Link, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ThemeColors } from '../../../theme/colors';
import { useTheme } from '../../../theme/useTheme';

/** Shown in place of the bike list whenever the garage is empty — first launch, or after the
 * last bike was archived/never added. There's no persisted "seen onboarding" flag: an empty
 * garage always warrants the same welcome + call-to-action, so re-showing it is correct, not
 * a bug to guard against. */
export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('onboarding.welcomeTitle')}</Text>
      <Text style={styles.tagline}>{t('onboarding.tagline')}</Text>

      <View style={styles.pitchList}>
        <Text style={styles.pitchLine}>{t('onboarding.pitchLine1')}</Text>
        <Text style={styles.pitchLine}>{t('onboarding.pitchLine2')}</Text>
        <Text style={styles.pitchLine}>{t('onboarding.pitchLine3')}</Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={() => router.push('/bikes/new')}>
        <Text style={styles.primaryButtonText}>{t('onboarding.addFirstBike')}</Text>
      </Pressable>

      <Link href="/dev/gps-spike" style={styles.devLink}>
        {t('bikeList.devLink')}
      </Link>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      textAlign: 'center',
      color: colors.text,
    },
    tagline: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    pitchList: {
      marginTop: 28,
      alignSelf: 'stretch',
    },
    pitchLine: {
      fontSize: 14,
      color: colors.chipText,
      marginTop: 10,
      textAlign: 'center',
    },
    primaryButton: {
      marginTop: 28,
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
    },
    primaryButtonText: {
      color: colors.onPrimary,
      fontWeight: '600',
    },
    devLink: {
      marginTop: 24,
      fontSize: 12,
      color: colors.textDisabled,
    },
  });
}
