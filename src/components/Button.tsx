import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/useTheme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghostDanger';

/**
 * The app's one button. `primary` is the solid brand CTA, `secondary` a surface-colored
 * sibling for navigation-ish actions, `danger` a solid destructive CTA (e.g. Stop),
 * `ghostDanger` a background-less destructive action (e.g. Archive/Retire/Discard).
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable
      style={[styles.base, styles[variant], disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.textBase, styles[`${variant}Text`]]}>{title}</Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    base: {
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    disabled: {
      opacity: 0.6,
    },
    textBase: {
      fontWeight: '600',
      fontSize: 16,
    },
    primary: {
      backgroundColor: colors.primary,
    },
    primaryText: {
      color: colors.onPrimary,
    },
    secondary: {
      backgroundColor: colors.surface,
    },
    secondaryText: {
      color: colors.primary,
    },
    danger: {
      backgroundColor: colors.danger,
    },
    dangerText: {
      color: colors.onPrimary,
    },
    ghostDanger: {},
    ghostDangerText: {
      color: colors.danger,
    },
  });
}
