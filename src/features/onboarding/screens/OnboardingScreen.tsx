import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/** Shown in place of the bike list whenever the garage is empty — first launch, or after the
 * last bike was archived/never added. There's no persisted "seen onboarding" flag: an empty
 * garage always warrants the same welcome + call-to-action, so re-showing it is correct, not
 * a bug to guard against. */
export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  pitchList: {
    marginTop: 28,
    alignSelf: 'stretch',
  },
  pitchLine: {
    fontSize: 14,
    color: '#333333',
    marginTop: 10,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 28,
    backgroundColor: '#2f6f4f',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  devLink: {
    marginTop: 24,
    fontSize: 12,
    color: '#999999',
  },
});
