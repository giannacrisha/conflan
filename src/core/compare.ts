// Compares a shared schedule with the viewer's own, so a friend can see where
// they overlap, where they split up and what they could add.

import { overlaps } from './slots';
import type { Session } from './types';

export type CompareStatus =
  /** Both people picked it: go together */
  | 'both'
  /** Only the sharer picked it and it fits the viewer's plan */
  | 'free'
  /** Only the sharer picked it and it overlaps a different pick of the viewer's */
  | 'clash';

export type CompareRow = { session: Session; status: CompareStatus; clashesWith: Session[] };

export type CompareSummary = { rows: CompareRow[]; both: number; free: number; clash: number };

/** Classifies each of `theirs` against `mine`. Both lists are full sessions. */
export function compareSchedules(theirs: Session[], mine: Session[]): CompareSummary {
  const mineIds = new Set(mine.map((s) => s.id));
  const rows = [...theirs]
    .sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id))
    .map((session): CompareRow => {
      if (mineIds.has(session.id)) return { session, status: 'both', clashesWith: [] };
      const clashesWith = mine.filter((m) => overlaps(m, session));
      return { session, status: clashesWith.length ? 'clash' : 'free', clashesWith };
    });
  const count = (status: CompareStatus) => rows.filter((r) => r.status === status).length;
  return { rows, both: count('both'), free: count('free'), clash: count('clash') };
}

/** Share link query: `?picks=a,b,c&from=Gi`. Unknown ids are dropped by the caller. */
export function shareQuery(picks: Iterable<string>, from?: string): string {
  const params = [`picks=${[...picks].map(encodeURIComponent).join(',')}`];
  const name = from?.trim();
  if (name) params.push(`from=${encodeURIComponent(name.slice(0, 40))}`);
  return params.join('&');
}

export function parsePicks(raw: string | undefined): string[] {
  return [
    ...new Set(
      (raw ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ];
}
