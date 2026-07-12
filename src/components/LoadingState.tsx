import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/useTheme';

/** Full-screen centered spinner shown while a screen's queries load. */
export function LoadingState() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
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
  });
}
