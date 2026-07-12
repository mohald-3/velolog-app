# Pattern: Screen + route

**When:** any new user-facing screen.

**Location:** component in `src/features/<feature>/screens/<Name>Screen.tsx`; route stub in `src/app/...` mirroring the URL. Route files contain zero logic:

```tsx
// src/app/bikes/[id]/stats.tsx
import BikeStatsScreen from '../../../features/bikes/screens/BikeStatsScreen';

export default function BikeStatsRoute() {
  return <BikeStatsScreen />;
}
```

## Every screen must have

- **Shared primitives first**: `src/components/` has `Button` (primary/secondary/danger/ghostDanger), `FormField`, `StatRow`, `Card`, `Chip`, `LoadingState` — use them instead of hand-rolling. They theme themselves; pass only margins via `style`.
- **i18n**: `useTranslation()`, every user-facing string via `t('feature.key')`. Add keys to BOTH `src/i18n/en.json` and `src/i18n/sv.json` in the same commit — never hardcode text.
- **Theme**: `useTheme()` + a `createStyles(colors: ThemeColors)` factory at the bottom of the file, memoized with `const styles = useMemo(() => createStyles(colors), [colors])`. No inline style objects, no raw hex colors — only `ThemeColors` tokens.
- **Safe area**: `useSafeAreaInsets()`; scrollable content gets `paddingBottom: <base> + insets.bottom` (the app is edge-to-edge on Android — bottom content is untappable without this).
- **Loading state**: return `<LoadingState />` while queries load.
- **Empty state**: a translated message when the list/data is empty.
- **Query keys**: hooks take keys from `src/features/queryKeys.ts` — never define key shapes locally.
- **Mutations**: call `mutation.mutate(vars, { onSuccess: ... })` for navigation-after-save; failures surface via the global mutation error alert in `_layout.tsx`. Only opt out (`meta: { suppressErrorAlert: true }`) when the screen owns a bespoke failure flow (see the ride-save retry).
- **Units**: user-facing distance/speed always via `formatDistance`/`formatSpeed` from `src/domain/units.ts` with `settings.unitSystem` — never `.toFixed()` on raw meters.
- **Header actions**: page actions (share, edit, delete) are header icons via `Stack.Screen options`, not bottom buttons. More than ~2 actions → put extras behind a "⋮" overflow icon that opens a real anchored dropdown menu (icon + label rows), never a shortcut straight to one action.
- **No data access**: screens consume feature hooks only — never repositories or `db` directly. Domain math via `src/domain` functions, not reimplemented inline.

## Size

~200 lines excluding the `createStyles` block is the "consider splitting" threshold: extract subcomponents (see `Stat` in `BikeStatsScreen`) or move logic into a hook. Check `src/components/` for an existing primitive before hand-rolling a card/button/form row; extract a new primitive there once the same pattern appears on a third screen.

## Skeleton

```tsx
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ThemeColors } from '../../../theme/colors';
import { useTheme } from '../../../theme/useTheme';
import { useSettings } from '../../settings/hooks/useSettings';
import { useThings } from '../hooks/useThings';

export default function ThingListScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: things, isLoading } = useThings();
  const { data: settings, isLoading: isLoadingSettings } = useSettings();

  if (isLoading || isLoadingSettings || !settings) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
      <Stack.Screen options={{ title: t('things.headerTitle') }} />
      {things?.length === 0 ? (
        <Text style={styles.emptyText}>{t('things.emptyText')}</Text>
      ) : (
        /* content */
        null
      )}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { padding: 20 },
    emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: 20 },
  });
}
```

Existing exemplars: `BikeStatsScreen.tsx` (small, canonical), `RideDetailScreen.tsx` (header share icon + "⋮" overflow dropdown), `RideListScreen.tsx` (`SectionList` grouped by day).
