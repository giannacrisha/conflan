// Derives everything the planner screens need from the event data and the
// attendee's saved choices: days, slots, rankings, picks and conflicts.

import { useMemo } from 'react';

import { rankSessions, type Scored } from '@/core/score';
import { buildDays, findConflicts, type DayPlan } from '@/core/slots';
import { dayKey } from '@/core/time';
import type { EventData, Session } from '@/core/types';
import { useEventData } from './data';
import { usePlanner } from './store';

const NO_PICKS: string[] = [];

export type PlanModel = {
  data: EventData;
  tz: string;
  accent: string;
  days: DayPlan[];
  byId: Map<string, Session>;
  ranked: Map<string, Scored[]>;
  picked: Set<string>;
  /** Picks whose sessions disappeared from the agenda (cancelled or moved) */
  missing: string[];
  conflicts: Set<string>;
  hasProfile: boolean;
};

export function usePlan(eventId: string) {
  const { data, loading, error } = useEventData(eventId);
  const profile = usePlanner((s) => s.profile);
  const tracks = usePlanner((s) => s.tracks[eventId]);
  const pickIds = usePlanner((s) => s.picks[eventId]) ?? NO_PICKS;

  const model = useMemo<PlanModel | undefined>(() => {
    if (!data) return undefined;
    const tz = data.event.timezone;
    const byId = new Map(data.sessions.map((s) => [s.id, s]));
    const days = buildDays(data.sessions, tz);
    const ctx = { profile, prefs: { tracks: tracks ?? [] }, trackGroups: data.event.trackGroups };
    const ranked = new Map<string, Scored[]>();
    for (const day of days) {
      for (const slot of day.slots) {
        ranked.set(
          slot.id,
          rankSessions(
            slot.sessionIds.map((id) => byId.get(id)!),
            ctx,
          ),
        );
      }
    }
    const picked = new Set(pickIds.filter((id) => byId.has(id)));
    return {
      data,
      tz,
      accent: data.event.theme.accent,
      days,
      byId,
      ranked,
      picked,
      missing: pickIds.filter((id) => !byId.has(id)),
      conflicts: findConflicts([...picked].map((id) => byId.get(id)!)),
      hasProfile: !!(profile.careerLevel || profile.interests.length || tracks?.length),
    };
  }, [data, profile, tracks, pickIds]);

  return { model, loading, error };
}

/** Picked sessions for a day in time order, including fixed blocks if asked */
export function daySchedule(model: PlanModel, day: DayPlan, includeFixed: boolean): Session[] {
  const picks = [...model.picked].map((id) => model.byId.get(id)!).filter((s) => dayKey(s.start, model.tz) === day.day);
  const all = includeFixed ? [...picks, ...day.fixed.filter((s) => !model.picked.has(s.id))] : picks;
  return all.sort((a, b) => a.start.localeCompare(b.start));
}
