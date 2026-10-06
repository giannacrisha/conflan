import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { C, serif } from './theme';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'link';
  accent?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', accent = C.plum, disabled, style }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && { backgroundColor: accent },
        variant === 'ghost' && { borderWidth: 1, borderColor: accent },
        variant === 'link' && styles.link,
        (pressed || disabled) && { opacity: 0.6 },
        style,
      ]}>
      <Text
        style={[styles.buttonText, { color: variant === 'primary' ? C.white : variant === 'link' ? C.muted : accent }]}>
        {label}
      </Text>
    </Pressable>
  );
}

type ChipProps = { label: string; selected?: boolean; onPress?: () => void; accent?: string };

export function Chip({ label, selected, onPress, accent = C.plum }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!selected }}
      onPress={onPress}
      style={[styles.chip, selected && { backgroundColor: accent, borderColor: accent }]}>
      <Text style={[styles.chipText, { color: selected ? C.white : accent }]}>{label}</Text>
    </Pressable>
  );
}

type SegmentedProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (value: T) => void;
  accent?: string;
};

export function Segmented<T extends string>({ options, value, onChange, accent = C.plum }: SegmentedProps<T>) {
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && styles.segmentActive]}>
            <Text style={[styles.segmentText, active && { color: accent, fontWeight: '600' }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

export function Kicker({ children, color = C.plum }: { children: ReactNode; color?: string }) {
  return <Text style={[styles.kicker, { color }]}>{children}</Text>;
}

export function Title({ children, color = C.ink, size = 26 }: { children: ReactNode; color?: string; size?: number }) {
  return <Text style={[styles.title, { color, fontSize: size }]}>{children}</Text>;
}

export const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: { paddingHorizontal: 8 },
  buttonText: { fontSize: 14, fontWeight: '600' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  segmented: { flexDirection: 'row', backgroundColor: C.plumTint, borderRadius: 10, padding: 4, gap: 4 },
  segment: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  segmentActive: { backgroundColor: C.white },
  segmentText: { fontSize: 13, fontWeight: '500', color: C.muted },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: C.body },
  kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  title: { fontFamily: serif, fontWeight: '700', lineHeight: 34 },
});
