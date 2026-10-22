import { StyleSheet, Text, View } from 'react-native';

import type { ThemeVariant } from '@/core/palette';
import { haptic, PressableScale } from './motion';
import { F, R, type Theme } from './theme';
import { useEventVariants, useStyles, useTheme } from './theme-context';

/** Two-tone dot showing a variant's strong color and highlight */
function Swatch({ variant, size }: { variant: ThemeVariant; size: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', flexDirection: 'row' }}>
      <View style={{ flex: 1, backgroundColor: variant.ink }} />
      <View style={{ flex: 1, backgroundColor: variant.accent }} />
    </View>
  );
}

/**
 * The event's color options. `compact` shows dots only (for headers);
 * the full version labels each option. Renders nothing for events without options.
 */
export function ThemeSwitcher({ eventId, compact }: { eventId: string; compact?: boolean }) {
  const C = useTheme();
  const styles = useStyles(makeStyles);
  const { variants, index, select } = useEventVariants(eventId);
  if (variants.length < 2) return null;

  return (
    <View
      style={[styles.row, compact && styles.compact]}
      accessibilityRole="radiogroup"
      accessibilityLabel="Event colors">
      {variants.map((v, i) => {
        const on = i === index;
        return (
          <PressableScale
            key={v.name}
            onPress={() => {
              haptic.tap();
              select(i);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${v.name} colors`}
            style={[compact ? styles.dot : styles.option, on && (compact ? styles.dotOn : styles.optionOn)]}>
            <Swatch variant={v} size={compact ? 22 : 28} />
            {compact ? null : <Text style={[styles.label, on && { color: C.white }]}>{v.name}</Text>}
          </PressableScale>
        );
      })}
    </View>
  );
}

const makeStyles = (C: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    compact: { gap: 4, backgroundColor: C.surface, borderRadius: R.pill, padding: 4 },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingLeft: 6,
      paddingRight: 14,
      paddingVertical: 6,
      borderRadius: R.pill,
      backgroundColor: C.surface,
      borderWidth: 1.5,
      borderColor: C.line,
    },
    optionOn: { backgroundColor: C.ink, borderColor: C.ink },
    label: { fontSize: 13, fontFamily: F.medium, color: C.ink },
    dot: { padding: 3, borderRadius: R.pill, borderWidth: 2, borderColor: 'transparent' },
    dotOn: { borderColor: C.ink },
  });
