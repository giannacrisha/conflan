import { dayKey, durationMinutes, minuteOfDay } from './time';
import type { Session } from './types';

/** Sessions longer than this (expo halls, all-day exhibits) don't define a slot */
export const BACKGROUND_MINUTES = 150;

/** A time block where the attendee picks one of several overlapping sessions */
export type Slot = {
  id: string;
  day: string;
  start: string;
  end: string;
  sessionIds: string[];
};

export type DayPlan = {
  day: string;
  /** Everyone-attends blocks shown locked on the timeline */
  fixed: Session[];
  /** Long-running optional things shown alongside the timeline */
  background: Session[];
  slots: Slot[];
};

const byStart = (a: Session, b: Session) =>
  a.start.localeCompare(b.start) || a.end.localeCompare(b.end) || a.id.localeCompare(b.id);

/**
 * Splits an event's sessions into days, then groups overlapping choices into slots.
 * Start times are staggered (9:00, 10:05, 10:15...), so slots are derived from
 * overlap rather than a fixed grid.
 */
export function buildDays(sessions: Session[], timeZone: string): DayPlan[] {
  const days = new Map<string, Session[]>();
  for (const s of sessions) {
    const key = dayKey(s.start, timeZone);
    const list = days.get(key);
    if (list) list.push(s);
    else days.set(key, [s]);
  }

  return [...days.keys()].sort().map((day) => {
    const list = days.get(day)!.sort(byStart);
    const fixed = list.filter((s) => s.isFixed);
    const background = list.filter((s) => !s.isFixed && durationMinutes(s.start, s.end) > BACKGROUND_MINUTES);
    const choices = list.filter((s) => !fixed.includes(s) && !background.includes(s));

    // A slot closes at the median end of its sessions, so one long session
    // (a 90-minute networking event) can't chain several blocks together.
    const slots: Slot[] = [];
    let current: Slot | undefined;
    let ends: string[] = [];
    for (const s of choices) {
      if (current && s.start < median(ends)) {
        current.sessionIds.push(s.id);
        ends.push(s.end);
        if (s.end > current.end) current.end = s.end;
      } else {
        ends = [s.end];
        const m = minuteOfDay(s.start, timeZone);
        current = {
          id: `${day}T${String(Math.floor(m / 60)).padStart(2, '0')}${String(m % 60).padStart(2, '0')}`,
          day,
          start: s.start,
          end: s.end,
          sessionIds: [s.id],
        };
        slots.push(current);
      }
    }
    return { day, fixed, background, slots };
  });
}

function median(values: string[]): string {
  const xs = [...values].sort();
  return xs[Math.floor((xs.length - 1) / 2)];
}

export function overlaps(a: Pick<Session, 'start' | 'end'>, b: Pick<Session, 'start' | 'end'>) {
  return a.start < b.end && b.start < a.end;
}

/** Ids of picked sessions that overlap another pick. Conflicts are flagged, not blocked. */
export function findConflicts(picked: Session[]): Set<string> {
  const out = new Set<string>();
  const sorted = [...picked].sort(byStart);
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length && sorted[j].start < sorted[i].end; j++) {
      out.add(sorted[i].id);
      out.add(sorted[j].id);
    }
  }
  return out;
}
