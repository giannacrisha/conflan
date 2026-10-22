// Design tokens: the Sunrise theme. Cream canvas, cocoa surfaces and marigold
// highlights, big rounded cards and pill controls. Each event keeps its own
// accent for its swatch and track dots.

export const C = {
  ink: '#241C17',
  ink2: '#43362E',
  body: '#3A302A',
  muted: '#7C7066',
  faint: '#BDAFA3',
  accent: '#FFBE2E',
  accentTint: '#FFF1CF',
  bg: '#F2EEE8',
  surface: '#FFFFFF',
  surfaceAlt: '#E8E2D8',
  sage: '#9A8F84',
  line: '#E2DBD0',
  white: '#FFFFFF',
  warn: '#B4401A',
  warnTint: '#FBE7DD',
};

export const R = { sm: 12, md: 20, lg: 28, pill: 999 };

/** Instrument Sans, loaded in the root layout. Set the family instead of fontWeight so Android picks the right file. */
export const F = {
  regular: 'InstrumentSans_400Regular',
  medium: 'InstrumentSans_500Medium',
  semibold: 'InstrumentSans_600SemiBold',
  bold: 'InstrumentSans_700Bold',
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
