import { Platform } from 'react-native';

export const C = {
  plum: '#41263F',
  plumTint: '#F3ECF2',
  ink: '#222222',
  body: '#333333',
  muted: '#6B6470',
  line: '#EEEEEE',
  border: '#D9CFD8',
  bg: '#FAF7F9',
  white: '#FFFFFF',
  fixed: '#EFE8EE',
  warn: '#A3361F',
  warnTint: '#FBEDE8',
};

export const serif = Platform.select({
  web: "Georgia, 'Times New Roman', serif",
  ios: 'Georgia',
  default: 'serif',
});

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

export const LINKS = {
  repo: 'https://github.com/giannacrisha/conflan',
  featureRequest: 'https://github.com/giannacrisha/conflan/issues/new?template=feature_request.yml',
  addEvent: 'https://github.com/giannacrisha/conflan/issues/new?template=new_event.yml',
};
