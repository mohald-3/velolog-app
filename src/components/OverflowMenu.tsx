import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/useTheme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export interface OverflowMenuItem {
  label: string;
  icon: IconName;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface OverflowMenuProps {
  visible: boolean;
  onClose: () => void;
  items: OverflowMenuItem[];
}

export function OverflowMenu({ visible, onClose, items }: OverflowMenuProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.menu, { top: insets.top + 48 }]}>
          {items.map((item) => {
            const color = item.destructive ? colors.danger : colors.text;
            return (
              <Pressable
                key={item.label}
                accessibilityRole="menuitem"
                disabled={item.disabled}
                style={({ pressed }) => [
                  styles.item,
                  pressed && styles.itemPressed,
                  item.disabled && styles.itemDisabled,
                ]}
                onPress={() => {
                  onClose();
                  item.onPress();
                }}
              >
                <Ionicons name={item.icon} size={18} color={color} />
                <Text style={[styles.label, { color }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
    },
    menu: {
      position: 'absolute',
      right: 12,
      minWidth: 180,
      paddingVertical: 4,
      borderRadius: 10,
      backgroundColor: colors.surface,
      elevation: 4,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    item: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    itemPressed: {
      opacity: 0.65,
    },
    itemDisabled: {
      opacity: 0.4,
    },
    label: {
      marginLeft: 10,
      fontSize: 15,
      fontWeight: '600',
    },
  });
}
