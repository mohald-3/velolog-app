import { useColorScheme } from 'react-native';

import { useSettings } from '../features/settings/hooks/useSettings';
import { darkColors, lightColors, type ThemeColors } from './colors';

export interface Theme {
  colors: ThemeColors;
  isDark: boolean;
}

/** Resolves the effective theme from the user's themeMode setting (system/light/dark) and the
 * device's current color scheme. Defaults to the system scheme before settings have loaded, so
 * there's no flash of the wrong theme while the settings query is in flight. */
export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const { data: settings } = useSettings();
  const themeMode = settings?.themeMode ?? 'system';
  const isDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark };
}
