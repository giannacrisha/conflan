// "People to meet": speakers whose sessions and background fit the attendee.
// Reuses session scoring so the reasons read the same as in the planner.

import { scoreSession, WEIGHTS, type ScoreContext } from './score';
import type { Session, Speaker } from './types';

export type SpeakerMatch = {
  speaker: Speaker;
  sessions: Session[];
  score: number;
  reasons: string[];
};

const BONUS = {
  /** Speaking at a session already in the attendee's plan: easy to say hello */
  inPlan: 2,
  /** Each additional relevant session they lead */
  extraSession: 1,
  maxExtra: 2,
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const keyOf = (p: Speaker) => `${p.name.toLowerCase()}|${(p.company ?? '').toLowerCase()}`;

export function rankSpeakers(
  sessions: Session[],
  ctx: ScoreContext,
  {
    picked = new Set<string>(),
    limit = 20,
    minScore = 3,
  }: { picked?: Set<string>; limit?: number; minScore?: number } = {},
): SpeakerMatch[] {
  // Format doesn't matter for meeting someone, so score sessions without it
  const sessionCtx: ScoreContext = { ...ctx, profile: { ...ctx.profile, format: undefined } };
  const bySpeaker = new Map<string, { speaker: Speaker; sessions: Session[] }>();
  for (const s of sessions) {
    for (const p of s.speakers) {
      const key = keyOf(p);
      const entry = bySpeaker.get(key) ?? { speaker: p, sessions: [] };
      entry.sessions.push(s);
      bySpeaker.set(key, entry);
    }
  }

  const matches: SpeakerMatch[] = [];
  for (const { speaker, sessions: theirs } of bySpeaker.values()) {
    const scored = theirs.map((s) => scoreSession(s, sessionCtx)).sort((a, b) => b.score - a.score);
    let score = Math.max(0, scored[0].score);
    const reasons = new Set(scored[0].reasons);

    const extra = scored.slice(1).filter((r) => r.score > 0).length;
    score += Math.min(extra, BONUS.maxExtra) * BONUS.extraSession;

    const about = `${speaker.title ?? ''}\n${speaker.company ?? ''}\n${speaker.bio ?? ''}`;
    const hits = ctx.profile.interests.filter((k) => new RegExp(`\\b${escapeRe(k.trim())}\\b`, 'i').test(about));
    score += Math.min(hits.length, WEIGHTS.maxKeywordHits) * WEIGHTS.keyword;
    hits.forEach((h) => reasons.add(h));

    if (theirs.some((s) => picked.has(s.id))) {
      score += BONUS.inPlan;
      reasons.add('Speaking at a session in your plan');
    }

    if (score >= minScore) matches.push({ speaker, sessions: theirs, score, reasons: [...reasons] });
  }

  return matches.sort((a, b) => b.score - a.score || a.speaker.name.localeCompare(b.speaker.name)).slice(0, limit);
}
