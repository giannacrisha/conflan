// Whova events. The public embedded agenda page loads the whole agenda from
// one GET endpoint, keyed by the event id in the embed URL.

import { stripHtml, uniq } from '../core/text';
import { zonedToUtc } from '../core/time';
import type { EventConfig, EventData, Session, Speaker, WhovaSource } from '../core/types';

const API = 'https://whova.com/xems/apis/event_webpage/agenda/public/get_agendas/';

type WhPerson = { name?: string; title?: string; aff?: string };
export type WhSession = {
  id: number;
  name: string;
  desc?: string;
  calendar_stime: string;
  calendar_etime: string;
  place?: string;
  type?: number;
  /** Keyed by role label, e.g. { Speakers: [...] } */
  speaker?: Record<string, WhPerson[]>;
  tracks?: { name: string }[];
  tags?: { name: string }[];
  /** Subsessions (individual talks inside a block) */
  programs?: WhSession[][];
};
export type WhAgenda = {
  event_basics: { event_name: string; timezone: string; is_virtual_event?: boolean };
  agenda: unknown[];
  agenda_tracks?: { name: string }[];
};

const FIXED_TRACKS = new Set(['Plenary']);
const FIXED_TITLE = /\b(registration|lunch|breakfast|dinner|coffee|tea|break|plenary|keynote|reception)\b/i;

function speakersOf(s: WhSession): Speaker[] {
  return Object.values(s.speaker ?? {})
    .flat()
    .filter((p) => p?.name)
    .map((p) => ({ name: p.name!, title: p.title || undefined, company: p.aff || undefined }));
}

/** Collects every top-level session object in Whova's nested time_ranges arrays */
function collectSessions(node: unknown, out: WhSession[]) {
  if (Array.isArray(node)) {
    for (const n of node) collectSessions(n, out);
  } else if (node && typeof node === 'object') {
    const obj = node as { sessions?: WhSession[] };
    if (Array.isArray(obj.sessions)) out.push(...obj.sessions);
    else for (const v of Object.values(obj)) collectSessions(v, out);
  }
}

export function mapWhova(data: WhAgenda, eventId: string): Session[] {
  const tz = data.event_basics.timezone;
  const raw: WhSession[] = [];
  collectSessions(data.agenda, raw);

  const out = new Map<string, Session>();
  for (const s of raw) {
    const id = String(s.id);
    if (out.has(id)) continue;
    const subs = (s.programs ?? []).flat();
    const tracks = uniq((s.tracks ?? []).map((t) => t.name));
    const subList = subs.map((p) => {
      const who = speakersOf(p).map((x) => x.name).join(', ');
      return `• ${p.name}${who ? ` (${who})` : ''}`;
    });
    const abstract = [stripHtml(s.desc), subList.length ? `Includes:\n${subList.join('\n')}` : undefined]
      .filter(Boolean)
      .join('\n\n');

    out.set(id, {
      id,
      eventId,
      title: s.name.replace(/\s*\(Click subsessions to view all\)\s*$/i, '').trim(),
      abstract: abstract || undefined,
      start: zonedToUtc(s.calendar_stime, tz),
      end: zonedToUtc(s.calendar_etime, tz),
      room: s.place || undefined,
      format: data.event_basics.is_virtual_event ? 'virtual' : 'in-person',
      type: tracks[0],
      tracks,
      levels: [],
      speakers: [...speakersOf(s), ...subs.flatMap(speakersOf)],
      // Logistics (registration, meals, receptions) are untracked in Whova
      isFixed: tracks.some((t) => FIXED_TRACKS.has(t)) || (tracks.length === 0 && FIXED_TITLE.test(s.name)),
    });
  }
  return [...out.values()];
}

export async function loadWhova(config: EventConfig, fetchFn: typeof fetch = fetch): Promise<EventData> {
  const src = config.source as WhovaSource;
  const res = await fetchFn(`${API}?event_id=${encodeURIComponent(src.eventId)}`);
  if (!res.ok) throw new Error(`Whova ${src.eventId}: HTTP ${res.status}`);
  const body = (await res.json()) as { result: string; data: WhAgenda };
  if (body.result !== 'success') throw new Error(`Whova ${src.eventId}: ${body.result}`);
  const { source, ...rest } = config;
  return {
    event: {
      ...rest,
      timezone: body.data.event_basics.timezone || config.timezone,
      platform: source.platform,
      trackGroups: [{ name: 'Tracks', tracks: (body.data.agenda_tracks ?? []).map((t) => t.name) }],
      updatedAt: new Date().toISOString(),
    },
    sessions: mapWhova(body.data, config.id),
  };
}
