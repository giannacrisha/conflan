/// <reference types="node" />
// Events with no supported platform: a hand-written JSON file matching
// docs/manual-event.example.json. Times are local to the event timezone.

import { readFile } from 'node:fs/promises';
import { zonedToUtc } from '../core/time';
import type { EventConfig, EventData, ManualSource, Session } from '../core/types';

type ManualSession = Omit<Session, 'eventId' | 'start' | 'end' | 'tracks' | 'levels' | 'speakers' | 'isFixed'> & {
  /** "YYYY-MM-DD HH:mm" in the event timezone */
  start: string;
  end: string;
  tracks?: string[];
  levels?: Session['levels'];
  speakers?: Session['speakers'];
  isFixed?: boolean;
};
export type ManualFile = {
  trackGroups?: EventData['event']['trackGroups'];
  sessions: ManualSession[];
};

export function mapManual(file: ManualFile, config: EventConfig): Session[] {
  return file.sessions.map((s, i) => {
    if (!s.id || !s.title || !s.start || !s.end) {
      throw new Error(`${config.id}: session #${i + 1} needs id, title, start and end`);
    }
    return {
      ...s,
      eventId: config.id,
      start: zonedToUtc(s.start, config.timezone),
      end: zonedToUtc(s.end, config.timezone),
      tracks: s.tracks ?? [],
      levels: s.levels ?? [],
      speakers: s.speakers ?? [],
      isFixed: s.isFixed ?? false,
    };
  });
}

export async function loadManual(config: EventConfig): Promise<EventData> {
  const src = config.source as ManualSource;
  const file = JSON.parse(await readFile(src.path, 'utf8')) as ManualFile;
  const { source, ...rest } = config;
  return {
    event: {
      ...rest,
      platform: source.platform,
      trackGroups: file.trackGroups ?? [],
      updatedAt: new Date().toISOString(),
    },
    sessions: mapManual(file, config),
  };
}
