import { describe, expect, it } from 'vitest';
import type { ScoreContext } from './score';
import { rankSpeakers } from './speakers';
import { makeSession as s } from './test-utils';

const ctx: ScoreContext = {
  profile: { careerLevel: 'early', format: 'in-person', interests: ['accessibility'] },
  prefs: { tracks: ['Job Search & Interview Readiness'] },
  trackGroups: [{ name: 'Hire', tracks: ['Job Search & Interview Readiness'] }],
};

const ada = { name: 'Ada Lovelace', company: 'Analytical Engines', bio: 'Builds accessibility tooling.' };
const grace = { name: 'Grace Hopper', company: 'Navy' };
const linus = { name: 'Linus T', company: 'Kernel' };

describe('rankSpeakers', () => {
  const sessions = [
    s({ id: 'a1', tracks: ['Job Search & Interview Readiness'], levels: ['early'], speakers: [ada] }),
    s({ id: 'a2', tracks: ['Job Search & Interview Readiness'], speakers: [ada], format: 'virtual' }),
    s({ id: 'g1', tracks: ['Job Search & Interview Readiness'], speakers: [grace] }),
    s({ id: 'l1', tracks: ['Quantum'], speakers: [linus] }),
  ];

  it('ranks by best session, extra sessions and bio keywords, and explains why', () => {
    const [first, second, ...rest] = rankSpeakers(sessions, ctx);
    expect(first.speaker.name).toBe('Ada Lovelace');
    expect(first.sessions.map((x) => x.id)).toEqual(['a1', 'a2']);
    // 5 (track + level) + 1 extra session + 1 bio keyword; virtual session isn't penalized
    expect(first.score).toBe(7);
    expect(first.reasons).toEqual(['Job Search & Interview Readiness', 'Early career', 'accessibility']);
    expect(second.speaker.name).toBe('Grace Hopper');
    expect(rest).toEqual([]);
  });

  it('boosts speakers at sessions already in the plan', () => {
    const ranked = rankSpeakers(sessions, ctx, { picked: new Set(['l1']), minScore: 1 });
    const l = ranked.find((m) => m.speaker.name === 'Linus T')!;
    expect(l.score).toBe(2);
    expect(l.reasons).toContain('Speaking at a session in your plan');
  });
});
