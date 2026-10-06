import type { CareerLevel, EventPrefs, Profile, Session, TrackGroup } from './types';

export const WEIGHTS = {
  track: 3,
  group: 1,
  level: 2,
  levelAll: 1,
  keyword: 1,
  maxKeywordHits: 2,
  formatMismatch: -100,
};

const LEVEL_LABEL: Record<CareerLevel, string> = {
  student: 'Student',
  early: 'Early career',
  mid: 'Mid-career',
  senior: 'Senior/Executive',
};

export type ScoreContext = {
  profile: Profile;
  prefs: EventPrefs;
  trackGroups: TrackGroup[];
};

export type Scored = {
  session: Session;
  score: number;
  /** Human-readable "Why this" lines */
  reasons: string[];
  forYou: boolean;
};

function groupIndex(groups: TrackGroup[]) {
  const map = new Map<string, string>();
  for (const g of groups) {
    map.set(g.name, g.name);
    for (const t of g.tracks) map.set(t, g.name);
  }
  return map;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function scoreSession(session: Session, ctx: ScoreContext): Omit<Scored, 'forYou'> {
  const { profile, prefs, trackGroups } = ctx;
  let score = 0;
  const reasons: string[] = [];

  const picked = new Set(prefs.tracks);
  const direct = session.tracks.filter((t) => picked.has(t));
  score += direct.length * WEIGHTS.track;
  reasons.push(...direct);

  if (direct.length === 0 && picked.size > 0) {
    const groupOf = groupIndex(trackGroups);
    const pickedGroups = new Set(prefs.tracks.map((t) => groupOf.get(t)).filter(Boolean));
    const shared = session.tracks.map((t) => groupOf.get(t)).find((g) => g && pickedGroups.has(g));
    if (shared) {
      score += WEIGHTS.group;
      reasons.push(shared);
    }
  }

  if (profile.careerLevel) {
    if (session.levels.includes(profile.careerLevel)) {
      score += WEIGHTS.level;
      reasons.push(LEVEL_LABEL[profile.careerLevel]);
    } else if (session.levels.includes('all')) {
      score += WEIGHTS.levelAll;
    }
  }

  if (profile.interests.length) {
    const haystack = `${session.title}\n${session.abstract ?? ''}`;
    const hits = profile.interests.filter((k) => new RegExp(`\\b${escapeRe(k.trim())}\\b`, 'i').test(haystack));
    score += Math.min(hits.length, WEIGHTS.maxKeywordHits) * WEIGHTS.keyword;
    reasons.push(...hits.slice(0, WEIGHTS.maxKeywordHits));
  }

  if (profile.format && session.format && session.format !== 'hybrid' && session.format !== profile.format) {
    score += WEIGHTS.formatMismatch;
    reasons.push(session.format === 'virtual' ? 'Virtual only' : 'In person only');
  }

  return { session, score, reasons };
}

/**
 * Ranks the sessions in one slot. The top few with a meaningful score get the
 * "For you" badge. Ties go to featured sessions, then alphabetical.
 */
export function rankSessions(
  sessions: Session[],
  ctx: ScoreContext,
  { forYouCount = 2, forYouMinScore = 3 } = {},
): Scored[] {
  const ranked = sessions
    .map((s) => scoreSession(s, ctx))
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(!!b.session.featured) - Number(!!a.session.featured) ||
        a.session.title.localeCompare(b.session.title),
    );
  return ranked.map((r, i) => ({ ...r, forYou: i < forYouCount && r.score >= forYouMinScore }));
}
