import type { Session } from './types';

/** Builds a session for tests; times are PDT wall clock on Oct 28, 2026 */
export function makeSession(over: Partial<Session> & { id: string; at?: string; until?: string }): Session {
  const { at = '09:00', until = '09:45', ...rest } = over;
  const toUtc = (hm: string) => {
    const [h, m] = hm.split(':').map(Number);
    return new Date(Date.UTC(2026, 9, 28, h + 7, m)).toISOString(); // PDT = UTC-7
  };
  return {
    eventId: 'test',
    title: `Session ${over.id}`,
    start: toUtc(at),
    end: toUtc(until),
    tracks: [],
    levels: [],
    speakers: [],
    isFixed: false,
    ...rest,
  };
}
