export interface ThemeColors {
  /** Screen background. */
  background: string;
  /** Card/row background — the app's one recurring "raised" surface. */
  surface: string;
  /** Input/chip borders. */
  surfaceBorder: string;
  /** Primary body text. */
  text: string;
  /** Subtitles — one step down from primary text. */
  textSecondary: string;
  /** Labels and metadata — the most-used muted tone. */
  textMuted: string;
  /** Placeholders and de-emphasized links (e.g. the dev GPS-spike link). */
  textDisabled: string;
  /** Unselected chip text. */
  chipText: string;
  /** Brand green — buttons, links, accents, "OK"/reached status. */
  primary: string;
  /** Text/icons on top of a `primary`-colored surface. */
  onPrimary: string;
  /** Destructive actions and "Overdue" status. */
  danger: string;
  /** "DueSoon" status. */
  warning: string;
  /** Menu/card drop shadows. */
  shadow: string;
}

export const lightColors: ThemeColors = {
  background: '#ffffff',
  surface: '#f2f2f2',
  surfaceBorder: '#dddddd',
  text: '#000000',
  textSecondary: '#666666',
  textMuted: '#888888',
  textDisabled: '#999999',
  chipText: '#333333',
  primary: '#2f6f4f',
  onPrimary: '#ffffff',
  danger: '#b00020',
  warning: '#b26a00',
  shadow: '#000000',
};

export const darkColors: ThemeColors = {
  background: '#000000',
  surface: '#1c1c1e',
  surfaceBorder: '#3a3a3c',
  text: '#ffffff',
  textSecondary: '#a0a0a0',
  textMuted: '#8e8e93',
  textDisabled: '#6e6e73',
  chipText: '#e5e5ea',
  primary: '#4bb587',
  onPrimary: '#ffffff',
  danger: '#ff6b6b',
  warning: '#e2a03f',
  shadow: '#000000',
};
