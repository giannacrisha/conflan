// Sessionize events. Thousands of tech conferences publish their agenda on
// Sessionize, and organizers who enable the public API get a JSON endpoint:
// https://sessionize.com/api/v2/<apiId>/view/All

import { clip, normalizeLevel, stripHtml, uniq } from '../core/text';
import { zonedToUtc } from '../core/time';
import type { EventConfig, EventData, Session, SessionizeSource, Speaker, TrackGroup } from '../core/types';

type SzItem = { id: number; name: string };
type SzCategory = { id: number; title: string; items: SzItem[]; type?: string };
type SzSpeaker = {
  id: string;
  fullName: string;
  bio?: string | null;
  tagLine?: string | null;
  links?: { linkType?: string; url: string }[];
};
type SzSession = {
  id: string;
  title: string;
  description?: string | null;
  /** Local event time without an offset, e.g. 2026-11-12T09:00:00 */
  startsAt: string | null;
  endsAt: string | null;
  isServiceSession?: boolean;
  isPlenumSession?: boolean;
  speakers: string[];
  categoryItems: number[];
  roomId?: number | null;
};
export type SzAll = {
  sessions: SzSession[];
  speakers: SzSpeaker[];
  categories: SzCategory[];
  rooms: { id: number; name: string }[];
};

const LEVEL = /level|audience|experience/i;
const FORMAT = /format|type/i;

/** "Staff Engineer at Acme" or "Staff Engineer, Acme" -> title + company */
export function splitTagLine(tag: string | null | undefined): Pick<Speaker, 'title' | 'company'> {
  if (!tag) return {};
  const m = tag.match(/^(.*?)\s+(?:at|@)\s+(.+)$/i) ?? tag.match(/^(.*?),\s+([^,]+)$/);
  return m ? { title: m[1].trim(), company: m[2].trim() } : { title: tag.trim() };
}

function trackCategories(all: SzAll) {
  return all.categories.filter((c) => c.type !== 'speaker' && !LEVEL.test(c.title) && !FORMAT.test(c.title));
}

export function sessionizeTrackGroups(all: SzAll): TrackGroup[] {
  return trackCategories(all).map((c) => ({ name: c.title, tracks: c.items.map((i) => i.name) }));
}

export function mapSessionize(all: SzAll, eventId: string, timeZone: string): Session[] {
  const item = new Map<number, { category: SzCategory; name: string }>();
  for (const category of all.categories) for (const i of category.items) item.set(i.id, { category, name: i.name });
  const rooms = new Map(all.rooms.map((r) => [r.id, r.name]));
  const people = new Map(
    all.speakers.map((p): [string, Speaker] => [
      p.id,
      {
        name: p.fullName,
        ...splitTagLine(p.tagLine),
        bio: clip(stripHtml(p.bio), 400),
        linkedIn: p.links?.find((l) => l.linkType === 'LinkedIn')?.url,
      },
    ]),
  );
  const trackCats = new Set(trackCategories(all).map((c) => c.id));

  return all.sessions
    .filter((s) => s.startsAt && s.endsAt)
    .map((s) => {
      const tags = s.categoryItems.map((id) => item.get(id)).filter((x) => !!x);
      return {
        id: s.id,
        eventId,
        title: s.title.trim(),
        abstract: stripHtml(s.description),
        start: zonedToUtc(s.startsAt!, timeZone),
        end: zonedToUtc(s.endsAt!, timeZone),
        room: s.roomId != null ? rooms.get(s.roomId) : undefined,
        type: tags.find((t) => FORMAT.test(t.category.title))?.name,
        tracks: uniq(tags.filter((t) => trackCats.has(t.category.id)).map((t) => t.name)),
        levels: uniq(tags.filter((t) => LEVEL.test(t.category.title)).flatMap((t) => normalizeLevel(t.name))),
        speakers: s.speakers.map((id) => people.get(id)).filter((p): p is Speaker => !!p),
        // Service sessions are breaks, lunch, registration; plenum sessions run in every room
        isFixed: !!(s.isServiceSession || s.isPlenumSession),
      };
    });
}

export async function loadSessionize(config: EventConfig, fetchFn: typeof fetch = fetch): Promise<EventData> {
  const src = config.source as SessionizeSource;
  const res = await fetchFn(`https://sessionize.com/api/v2/${encodeURIComponent(src.apiId)}/view/All`);
  if (!res.ok) throw new Error(`Sessionize ${src.apiId}: HTTP ${res.status}`);
  const all = (await res.json()) as SzAll;
  const { source, ...rest } = config;
  return {
    event: {
      ...rest,
      platform: source.platform,
      trackGroups: sessionizeTrackGroups(all),
      updatedAt: new Date().toISOString(),
    },
    sessions: mapSessionize(all, config.id, config.timezone),
  };
}
