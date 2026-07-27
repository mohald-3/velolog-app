import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { db } from '../data/db';
import migrations from '../../drizzle/migrations';
import i18n from '../i18n';
import { useSettings } from '../features/settings/hooks/useSettings';
import { useTheme } from '../theme/useTheme';

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    // Screens call mutations fire-and-forget (mutate + onSuccess for navigation); this is the
    // one place a failed write surfaces to the user. A mutation that owns its failure UX opts
    // out via meta: { suppressErrorAlert: true } (e.g. the ride-save retry flow).
    onError: (_error, _variables, _context, mutation) => {
      if (mutation.meta?.suppressErrorAlert) return;
      Alert.alert(i18n.t('common.errorTitle'), i18n.t('common.errorMessage'));
    },
  }),
});

function LocaleSync() {
  const { data: settings } = useSettings();
  const locale = settings?.locale;

  useEffect(() => {
    if (locale && i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale]);

  return null;
}

function ThemedNavigation() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Database migration failed</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <LocaleSync />
        <ThemedNavigation />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 13,
    color: '#666666',
  },
});
