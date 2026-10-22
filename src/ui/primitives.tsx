import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { haptic, PressableScale } from './motion';
import { C, F, R } from './theme';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  /** primary: ink pill · accent: marigold pill · ghost: outlined · ghostLight: outlined on dark · link: text only */
  variant?: 'primary' | 'accent' | 'ghost' | 'ghostLight' | 'link';
  /** Glyph in a circle at the end of the pill, like ↗ or + */
  icon?: string;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  small,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const fg = variant === 'primary' || variant === 'ghostLight' ? C.white : variant === 'link' ? C.muted : C.ink;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      onPress={() => {
        haptic.tap();
        onPress?.();
      }}
      disabled={disabled}
      style={[
        styles.button,
        small && styles.buttonSmall,
        icon ? styles.withIcon : null,
        variant === 'primary' && { backgroundColor: C.ink },
        variant === 'accent' && { backgroundColor: C.accent },
        variant === 'ghost' && { borderWidth: 1.5, borderColor: C.ink },
        variant === 'ghostLight' && { borderWidth: 1.5, borderColor: C.white },
        variant === 'link' && styles.link,
        disabled && { opacity: 0.4 },
        style,
      ]}>
      <Text style={[styles.buttonText, small && { fontSize: 13 }, { color: fg }]}>{label}</Text>
      {icon ? (
        <View style={[styles.icon, { backgroundColor: variant === 'primary' ? C.accent : C.ink }]}>
          <Text style={[styles.iconText, { color: variant === 'primary' ? C.ink : C.accent }]}>{icon}</Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

/** Round icon button, like the back and info circles in the header */
export function IconButton({
  glyph,
  onPress,
  label,
  dark,
}: {
  glyph: string;
  onPress: () => void;
  label: string;
  dark?: boolean;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      style={[styles.iconButton, dark && { backgroundColor: C.ink }]}>
      <Text style={[styles.iconButtonText, dark && { color: C.accent }]}>{glyph}</Text>
    </PressableScale>
  );
}

type ChipProps = { label: string; selected?: boolean; onPress?: () => void; dark?: boolean };

export function Chip({ label, selected, onPress, dark }: ChipProps) {
  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!selected }}
      onPress={() => {
        haptic.tap();
        onPress?.();
      }}
      style={[
        styles.chip,
        selected && { backgroundColor: dark ? C.ink : C.accent, borderColor: dark ? C.ink : C.accent },
      ]}>
      <Text style={[styles.chipText, selected && dark && { color: C.accent }]}>
        {selected ? '✓ ' : ''}
        {label}
      </Text>
    </PressableScale>
  );
}

type SegmentedProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (value: T) => void;
};

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => {
              haptic.tap();
              onChange(o.value);
            }}
            style={[styles.segment, active && styles.segmentActive]}>
            <Text style={[styles.segmentText, active && { color: C.white }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

export function Kicker({ children, color = C.muted }: { children: ReactNode; color?: string }) {
  return <Text style={[styles.kicker, { color }]}>{children}</Text>;
}

export function Title({ children, color = C.ink, size = 30 }: { children: ReactNode; color?: string; size?: number }) {
  return <Text style={[styles.title, { color, fontSize: size, lineHeight: Math.round(size * 1.15) }]}>{children}</Text>;
}

/** Rounded surface; `tone` picks white, ink or marigold */
export function Card({
  children,
  tone = 'light',
  style,
}: {
  children: ReactNode;
  tone?: 'light' | 'dark' | 'accent' | 'muted';
  style?: StyleProp<ViewStyle>;
}) {
  const bg = { light: C.surface, dark: C.ink, accent: C.accent, muted: C.surfaceAlt }[tone];
  return <View style={[styles.card, { backgroundColor: bg }, style]}>{children}</View>;
}

/** Big number with a label, like "4 Finished" */
export function Stat({ value, label, tone = 'light' }: { value: ReactNode; label: string; tone?: 'light' | 'dark' }) {
  const dark = tone === 'dark';
  return (
    <View style={[styles.stat, { backgroundColor: dark ? C.ink : C.surface }]}>
      <Text style={[styles.statValue, dark && { color: C.accent }]}>{value}</Text>
      <Text style={[styles.statLabel, dark && { color: C.faint }]}>{label}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: R.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonSmall: { minHeight: 38, paddingHorizontal: 16 },
  withIcon: { paddingRight: 6 },
  link: { paddingHorizontal: 8, minHeight: 40 },
  buttonText: { fontSize: 14, fontFamily: F.semibold, letterSpacing: -0.2 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 16, fontFamily: F.bold },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: { fontSize: 18, fontFamily: F.semibold, color: C.ink },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.surface,
  },
  chipText: { fontSize: 12, fontFamily: F.medium, color: C.ink },
  segmented: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.pill, padding: 4, gap: 4 },
  segment: { flex: 1, paddingVertical: 11, borderRadius: R.pill, alignItems: 'center' },
  segmentActive: { backgroundColor: C.ink },
  segmentText: { fontSize: 13, fontFamily: F.medium, color: C.muted },
  fieldLabel: { fontSize: 12, fontFamily: F.semibold, color: C.body, letterSpacing: 0.4 },
  kicker: { fontSize: 11, fontFamily: F.semibold, letterSpacing: 1.2 },
  title: { fontFamily: F.semibold, letterSpacing: -0.5 },
  card: { borderRadius: R.lg, padding: 20, gap: 10 },
  stat: { flex: 1, borderRadius: R.md, padding: 16, gap: 2, minHeight: 92, justifyContent: 'space-between' },
  statValue: { fontSize: 32, fontFamily: F.semibold, color: C.ink, letterSpacing: -0.75 },
  statLabel: { fontSize: 11, fontFamily: F.medium, color: C.muted },
});
