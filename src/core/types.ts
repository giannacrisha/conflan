// Shared schema. Every adapter converts its platform's agenda into these types,
// and everything in the app reads only these types.

export type CareerLevel = 'student' | 'early' | 'mid' | 'senior';
export type SessionLevel = CareerLevel | 'all';
export type Format = 'in-person' | 'virtual' | 'hybrid';

export type Speaker = {
  name: string;
  title?: string;
  company?: string;
};

export type Session = {
  id: string;
  eventId: string;
  title: string;
  abstract?: string;
  /** UTC ISO 8601, e.g. 2026-10-28T16:00:00.000Z */
  start: string;
  end: string;
  room?: string;
  format?: Format;
  /** Platform session type, e.g. Workshop, Panel, Mainstage */
  type?: string;
  featured?: boolean;
  /** Fine-grained topic names, e.g. "Job Search & Interview Readiness" */
  tracks: string[];
  levels: SessionLevel[];
  speakers: Speaker[];
  /** Everyone-attends blocks (registration, meals, plenaries) that are not a choice */
  isFixed: boolean;
  sourceUrl?: string;
};

/** Groups tracks for onboarding, e.g. GHC pillar "Hire" containing its sub-tracks */
export type TrackGroup = {
  name: string;
  tracks: string[];
};

export type RainFocusSource = {
  platform: 'rainfocus';
  apiProfileId: string;
  widgetId: string;
  /** Catalog day tabs, YYYYMMDD */
  days: string[];
  catalogUrl: string;
  /** Display order for track groups (e.g. GHC pillars); others follow alphabetically */
  groupOrder?: string[];
};

export type WhovaSource = {
  platform: 'whova';
  /** Decoded Whova event id from the embedded agenda URL */
  eventId: string;
};

export type ManualSource = {
  platform: 'manual';
  path: string;
};

export type EventSource = RainFocusSource | WhovaSource | ManualSource;

export type EventConfig = {
  id: string;
  name: string;
  timezone: string;
  /** YYYY-MM-DD in the event timezone */
  start: string;
  end: string;
  theme: { accent: string; logo?: string };
  source: EventSource;
};

export type ConferenceEvent = Omit<EventConfig, 'source'> & {
  platform: EventSource['platform'];
  trackGroups: TrackGroup[];
  updatedAt: string;
};

export type EventData = {
  event: ConferenceEvent;
  sessions: Session[];
};

export type Profile = {
  name?: string;
  careerLevel?: CareerLevel;
  format?: 'in-person' | 'virtual';
  /** Free-form interest keywords that carry across events */
  interests: string[];
};

export type EventPrefs = {
  /** Track names chosen for this event */
  tracks: string[];
};
