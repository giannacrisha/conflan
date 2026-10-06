// RainFocus session catalogs (e.g. Grace Hopper Celebration).
// The public catalog widget calls POST /api/sessions with two header ids that
// are embedded in the catalog page source (apiToken -> rfApiProfileId, widgetId -> rfWidgetId).

import { stripHtml, normalizeLevel, uniq } from '../core/text';
import { utcStringToIso } from '../core/time';
import type { EventConfig, EventData, Format, RainFocusSource, Session, TrackGroup } from '../core/types';

const API = 'https://events.rainfocus.com/api/sessions';
const PAGE_SIZE = 50;

type RfAttr = { attribute: string; value: string };
type RfTime = {
  sessionTimeID: string;
  utcStartTime: string;
  utcEndTime: string;
  room?: string;
};
export type RfItem = {
  /** Catalog day tab the item came from, YYYYMMDD (added by fetchDay) */
  day?: string;
  sessionID: string;
  sessionTimeID?: string;
  title: string;
  type?: string;
  abstract?: string;
  times?: RfTime[];
  attributevalues?: RfAttr[];
  participants?: { fullName?: string; jobTitle?: string; companyName?: string }[];
};

type RfPage = {
  // The first page nests results in sectionList; later pages return them flat.
  items?: RfItem[];
  total?: number;
  sectionList?: { items?: RfItem[]; total?: number }[];
  totalSearchItems?: number;
};

const FIXED_TYPES = new Set(['Mainstage']);
// Anchored so talk titles like "Systems That Don't Break" aren't treated as breaks
const FIXED_TITLE = /^(registration|lunch|breakfast|coffee|break|snack)\b/i;

async function fetchDay(src: RainFocusSource, day: string, fetchFn: typeof fetch) {
  const items: RfItem[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const res = await fetchFn(API, {
      method: 'POST',
      headers: {
        rfApiProfileId: src.apiProfileId,
        rfWidgetId: src.widgetId,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ 'tab.day': day, size: String(PAGE_SIZE), from: String(from) }).toString(),
    });
    if (!res.ok) throw new Error(`RainFocus ${day} from=${from}: HTTP ${res.status}`);
    const page = (await res.json()) as RfPage;
    const pageItems = page.items ?? page.sectionList?.[0]?.items ?? [];
    const total = page.total ?? page.sectionList?.[0]?.total ?? page.totalSearchItems ?? 0;
    items.push(...pageItems.map((i) => ({ ...i, day })));
    if (pageItems.length === 0 || items.length >= total) break;
  }
  return items;
}

const attrs = (item: RfItem, name: string) =>
  (item.attributevalues ?? []).filter((a) => a.attribute === name).map((a) => a.value);

export function mapRainFocus(items: RfItem[], eventId: string, src: RainFocusSource): Session[] {
  const out = new Map<string, Session>();
  for (const item of items) {
    // An item is one occurrence; repeat sessions list every time in `times`.
    const times = item.sessionTimeID
      ? (item.times ?? []).filter((t) => t.sessionTimeID === item.sessionTimeID)
      : (item.times ?? []);
    const subTracks = (item.attributevalues ?? [])
      .filter((a) => a.attribute.startsWith('Session Track:'))
      .map((a) => a.value);
    const pillars = attrs(item, 'Content Pillar');
    const formats = attrs(item, 'Format Type');
    const format: Format | undefined =
      formats.length > 1 ? 'hybrid' : formats[0] === 'Virtual' ? 'virtual' : formats[0] ? 'in-person' : undefined;
    const type = attrs(item, 'Session Type')[0] ?? item.type;

    for (const t of times) {
      const id = `${item.sessionID}-${t.sessionTimeID}`;
      if (out.has(id)) continue;
      out.set(id, {
        id,
        eventId,
        title: item.title.trim(),
        abstract: stripHtml(item.abstract),
        start: utcStringToIso(t.utcStartTime),
        end: utcStringToIso(t.utcEndTime),
        room: t.room && t.room !== 'TBD' ? t.room : undefined,
        format,
        type,
        featured: type === 'Featured',
        // Sub-tracks when present; otherwise the pillar, so the session still matches its group
        tracks: subTracks.length ? uniq(subTracks) : uniq(pillars),
        levels: uniq(attrs(item, 'Career Level').flatMap(normalizeLevel)),
        speakers: (item.participants ?? [])
          .filter((p) => p.fullName)
          .map((p) => ({ name: p.fullName!, title: p.jobTitle || undefined, company: p.companyName || undefined })),
        isFixed: FIXED_TYPES.has(type ?? '') || FIXED_TITLE.test(item.title),
        sourceUrl: item.day ? `${src.catalogUrl}?tab.day=${item.day}` : src.catalogUrl,
      });
    }
  }
  return [...out.values()];
}

/** Pillar -> sub-track groups, built from what the catalog actually uses */
export function trackGroupsFromItems(items: RfItem[]): TrackGroup[] {
  const groups = new Map<string, Set<string>>();
  for (const item of items) {
    for (const a of item.attributevalues ?? []) {
      const m = a.attribute.match(/^Session Track:\s*(.+)$/);
      if (!m) continue;
      const g = groups.get(m[1]) ?? new Set<string>();
      g.add(a.value);
      groups.set(m[1], g);
    }
  }
  return [...groups.entries()].map(([name, tracks]) => ({ name, tracks: [...tracks].sort() }));
}

export async function loadRainFocus(config: EventConfig, fetchFn: typeof fetch = fetch): Promise<EventData> {
  const src = config.source as RainFocusSource;
  const items: RfItem[] = [];
  for (const day of src.days) items.push(...(await fetchDay(src, day, fetchFn)));
  const { source, ...rest } = config;
  return {
    event: {
      ...rest,
      platform: source.platform,
      trackGroups: trackGroupsFromItems(items),
      updatedAt: new Date().toISOString(),
    },
    sessions: mapRainFocus(items, config.id, src),
  };
}
