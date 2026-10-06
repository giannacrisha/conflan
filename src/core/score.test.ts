import { describe, expect, it } from 'vitest';
import { rankSessions, scoreSession, type ScoreContext } from './score';
import { makeSession as s } from './test-utils';

const trackGroups = [
  { name: 'Hire', tracks: ['Job Search & Interview Readiness', 'Career Pathways & Transitions'] },
  { name: 'Train', tracks: ['Emerging Tech & Innovation', 'Hands-On Learning/Workshops'] },
];

const ctx: ScoreContext = {
  profile: { careerLevel: 'early', format: 'in-person', interests: ['accessibility'] },
  prefs: { tracks: ['Job Search & Interview Readiness'] },
  trackGroups,
};

describe('scoreSession', () => {
  it('explains a strong match', () => {
    const r = scoreSession(
      s({ id: 'x', tracks: ['Job Search & Interview Readiness'], levels: ['early'], format: 'in-person' }),
      ctx,
    );
    expect(r.score).toBe(5);
    expect(r.reasons).toEqual(['Job Search & Interview Readiness', 'Early career']);
  });

  it('gives partial credit for the same pillar', () => {
    const r = scoreSession(s({ id: 'x', tracks: ['Career Pathways & Transitions'] }), ctx);
    expect(r.score).toBe(1);
    expect(r.reasons).toEqual(['Hire']);
  });

  it('matches interest keywords on word boundaries', () => {
    const hit = scoreSession(s({ id: 'x', title: 'Accessibility in Firmware' }), ctx);
    const miss = scoreSession(s({ id: 'y', title: 'Inaccessibility myths' }), ctx);
    expect(hit.reasons).toContain('accessibility');
    expect(miss.score).toBe(0);
  });

  it('sinks sessions in the wrong format', () => {
    const r = scoreSession(s({ id: 'x', format: 'virtual' }), ctx);
    expect(r.score).toBeLessThan(0);
    expect(r.reasons).toContain('Virtual only');
  });
});

describe('rankSessions', () => {
  it('ranks by score, breaks ties with featured, and badges the top picks', () => {
    const ranked = rankSessions(
      [
        s({ id: 'plain', title: 'B plain' }),
        s({ id: 'featured', title: 'C featured', featured: true }),
        s({ id: 'best', tracks: ['Job Search & Interview Readiness'], levels: ['early'] }),
        s({ id: 'good', tracks: ['Job Search & Interview Readiness'] }),
      ],
      ctx,
    );
    expect(ranked.map((r) => r.session.id)).toEqual(['best', 'good', 'featured', 'plain']);
    expect(ranked.map((r) => r.forYou)).toEqual([true, true, false, false]);
  });

  it('gives no badges when the profile was skipped', () => {
    const ranked = rankSessions([s({ id: 'a' }), s({ id: 'b' })], {
      profile: { interests: [] },
      prefs: { tracks: [] },
      trackGroups,
    });
    expect(ranked.every((r) => !r.forYou)).toBe(true);
  });
});
