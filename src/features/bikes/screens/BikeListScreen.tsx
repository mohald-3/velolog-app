import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Bike } from '../../../domain/types';
import type { ThemeColors } from '../../../theme/colors';
import { useTheme } from '../../../theme/useTheme';
import OnboardingScreen from '../../onboarding/screens/OnboardingScreen';
import { useBikes } from '../hooks/useBikes';

export default function BikeListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: bikes, isLoading } = useBikes();

  const headerOptions = {
    title: t('bikeList.headerTitle'),
    headerRight: () => (
      <View style={styles.headerActions}>
        <Pressable onPress={() => router.push('/journey')} hitSlop={12} style={styles.headerButton}>
          <Ionicons name="stats-chart-outline" size={22} color={colors.primary} />
        </Pressable>
        <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
          <Ionicons name="settings-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>
    ),
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={headerOptions} />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!bikes || bikes.length === 0) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <OnboardingScreen />
      </>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={headerOptions} />
      <FlatList
        data={bikes}
        keyExtractor={(bike) => bike.id}
        contentContainerStyle={[styles.list, { paddingBottom: 16 + insets.bottom }]}
        renderItem={({ item }) => <BikeRow bike={item} styles={styles} />}
      />
      <Pressable
        style={[styles.fab, { bottom: 20 + insets.bottom }]}
        onPress={() => router.push('/bikes/new')}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

function BikeRow({ bike, styles }: { bike: Bike; styles: ReturnType<typeof createStyles> }) {
  const router = useRouter();
  return (
    <Pressable style={styles.row} onPress={() => router.push(`/bikes/${bike.id}`)}>
      <Text style={styles.rowTitle}>{bike.name}</Text>
      {(bike.brand || bike.model) && (
        <Text style={styles.rowSubtitle}>{[bike.brand, bike.model].filter(Boolean).join(' ')}</Text>
      )}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerButton: {
      marginRight: 16,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    list: {
      padding: 16,
    },
    row: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    rowTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
    },
    rowSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
    },
    fabText: {
      color: colors.onPrimary,
      fontSize: 28,
      lineHeight: 30,
    },
  });
}
