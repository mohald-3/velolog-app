import { useMemo } from 'react';
import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions, type StyleProp, type ViewStyle } from 'react-native';

import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/useTheme';

/** A labeled text input — the app's standard form row. */
export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  style,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textDisabled}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    field: {
      marginBottom: 16,
    },
    label: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 4,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.text,
    },
    inputMultiline: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
  });
}
