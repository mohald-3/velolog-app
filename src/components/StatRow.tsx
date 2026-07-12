import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/useTheme';

/** A muted label over a bold value — the app's standard stat display. `lg` is for the live
 * recording screen's bigger numbers. */
export function StatRow({ label, value, size = 'md' }: { label: string; value: string; size?: 'md' | 'lg' }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.stat}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, size === 'lg' && styles.valueLg]}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    stat: {
      marginTop: 8,
    },
    label: {
      fontSize: 12,
      color: colors.textMuted,
    },
    value: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    valueLg: {
      fontSize: 22,
    },
  });
}
