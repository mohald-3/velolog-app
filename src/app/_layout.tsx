import { Stack } from 'expo-router';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { db } from '../data/db';
import migrations from '../../drizzle/migrations';

const queryClient = new QueryClient();

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
    <QueryClientProvider client={queryClient}>
      <Stack />
    </QueryClientProvider>
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
