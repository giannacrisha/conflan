// Event color themes. An organizer gives three colors per variant (a strong
// color for headings and dark cards, a highlight, and a page background) and
// the rest of the UI palette is derived so text keeps its contrast.

export type Theme = {
  /** Headings, dark cards, primary buttons */
  ink: string;
  ink2: string;
  /** Body text */
  body: string;
  muted: string;
  /** Muted text on ink surfaces */
  faint: string;
  /** Highlights: selected pills, plus buttons, progress */
  accent: string;
  accentTint: string;
  /** Text and icons drawn on top of accent */
  onAccent: string;
  bg: string;
  surface: string;
  surfaceAlt: string;
  sage: string;
  line: string;
  white: string;
  warn: string;
  warnTint: string;
};

/** One swappable color option for an event */
export type ThemeVariant = { name: string; ink: string; accent: string; bg: string };

const rgb = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (c: number[]) =>
  '#' +
  c
    .map((v) => Math.round(v).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

/** Blend `a` toward `b` by `t` (0 = a, 1 = b) */
export function mix(a: string, b: string, t: number): string {
  const [x, y] = [rgb(a), rgb(b)];
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
}

function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1 to 21 */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function buildTheme({ ink, accent, bg }: Pick<ThemeVariant, 'ink' | 'accent' | 'bg'>): Theme {
  const body = mix(ink, '#111111', 0.6);
  return {
    ink,
    ink2: mix(ink, '#FFFFFF', 0.15),
    body,
    muted: mix(mix(ink, '#333333', 0.55), bg, 0.22),
    faint: mix(ink, '#FFFFFF', 0.65),
    accent,
    accentTint: mix(accent, '#FFFFFF', 0.8),
    onAccent: contrast(accent, '#FFFFFF') >= contrast(accent, body) ? '#FFFFFF' : body,
    bg,
    surface: '#FFFFFF',
    surfaceAlt: mix(bg, ink, 0.08),
    sage: mix(ink, bg, 0.5),
    line: mix(bg, ink, 0.12),
    white: '#FFFFFF',
    warn: '#B4401A',
    warnTint: '#FBE7DD',
  };
}
