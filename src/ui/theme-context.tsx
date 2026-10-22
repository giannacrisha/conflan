// Per-event colors. Event screens render inside <ThemeProvider> with the
// event's chosen variant; everything else falls back to the app theme.

import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { buildTheme, type Theme, type ThemeVariant } from '@/core/palette';
import { useEventData } from '@/lib/data';
import { usePlanner } from '@/lib/store';
import { C } from './theme';

const ThemeContext = createContext<Theme>(C);

export function ThemeProvider({ value, children }: { value: Theme; children: ReactNode }) {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

/** Memoized StyleSheet for the current theme: `const styles = useStyles(makeStyles)` */
export function useStyles<T>(factory: (t: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}

const NO_VARIANTS: ThemeVariant[] = [];

/** The event's color options and the one this attendee picked */
export function useEventVariants(eventId: string) {
  const { data } = useEventData(eventId);
  const variants = data?.event.theme.variants ?? NO_VARIANTS;
  const chosen = usePlanner((s) => s.themeVariant[eventId]) ?? 0;
  const setVariant = usePlanner((s) => s.setThemeVariant);
  const index = variants.length ? chosen % variants.length : 0;
  return { variants, index, select: (i: number) => setVariant(eventId, i) };
}

export function useEventTheme(eventId: string): Theme {
  const { variants, index } = useEventVariants(eventId);
  const variant = variants[index];
  return useMemo(() => (variant ? buildTheme(variant) : C), [variant]);
}
