// Design tokens. Ink and lime on a soft sage-gray canvas, big rounded cards and
// pill controls. Each event keeps its own accent for its swatch and track dots.

export const C = {
  ink: '#111111',
  ink2: '#1F1F1F',
  body: '#2B2B2B',
  muted: '#6B7067',
  faint: '#A3A79E',
  lime: '#D8F26A',
  limeTint: '#F2FAD3',
  bg: '#ECEEE8',
  surface: '#FFFFFF',
  surfaceAlt: '#E2E5DE',
  sage: '#8E978B',
  line: '#DADDD5',
  white: '#FFFFFF',
  warn: '#C2410C',
  warnTint: '#FCE9DF',
};

export const R = { sm: 12, md: 20, lg: 28, pill: 999 };

/** Geist Mono, loaded in the root layout. Set the family instead of fontWeight so Android picks the right file. */
export const F = {
  regular: 'GeistMono_400Regular',
  medium: 'GeistMono_500Medium',
  semibold: 'GeistMono_600SemiBold',
  bold: 'GeistMono_700Bold',
};

/** Split view (Option E) at this width and up; timeline (Option A) below */
export const WIDE = 960;

const GROUP_COLORS: Record<string, string> = {
  Train: '#1F7A8C',
  Hire: '#C77C02',
  Advance: '#7B3F8C',
  Fund: '#2F7D4F',
};
const FALLBACK = ['#1F7A8C', '#C77C02', '#7B3F8C', '#2F7D4F', '#A3361F', '#3B5BA5'];

export function groupColor(name: string, index = 0) {
  return GROUP_COLORS[name] ?? FALLBACK[index % FALLBACK.length];
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const LINKS = {
  repo: 'https://github.com/giannacrisha/conplan',
  featureRequest: 'https://github.com/giannacrisha/conplan/issues/new?template=feature_request.yml',
  addEvent: 'https://github.com/giannacrisha/conplan/issues/new?template=new_event.yml',
};
