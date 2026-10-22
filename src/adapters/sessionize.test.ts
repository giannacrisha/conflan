import { describe, expect, it } from 'vitest';
import { mapSessionize, sessionizeTrackGroups, splitTagLine, type SzAll } from './sessionize';

// Shape of a public /api/v2/<id>/view/All response, trimmed to what we read
const all: SzAll = {
  sessions: [
    {
      id: '101',
      title: 'Lunch',
      startsAt: '2026-11-12T12:00:00',
      endsAt: '2026-11-12T13:00:00',
      isServiceSession: true,
      speakers: [],
      categoryItems: [],
      roomId: null,
    },
    {
      id: '102',
      title: ' Shipping LLM features ',
      description: '<p>Evals &amp; guardrails</p>',
      startsAt: '2026-11-12T09:00:00',
      endsAt: '2026-11-12T09:45:00',
      speakers: ['s1'],
      categoryItems: [1, 2, 3],
      roomId: 7,
    },
    { id: '103', title: 'Unscheduled', startsAt: null, endsAt: null, speakers: [], categoryItems: [] },
  ],
  speakers: [
    {
      id: 's1',
      fullName: 'Ada Lovelace',
      tagLine: 'Staff Engineer at Analytical Engines',
      bio: 'Writes <b>programs</b>.',
      links: [{ linkType: 'LinkedIn', url: 'https://linkedin.com/in/ada' }],
    },
  ],
  categories: [
    { id: 10, title: 'Track', type: 'session', items: [{ id: 1, name: 'AI' }] },
    { id: 11, title: 'Level', type: 'session', items: [{ id: 2, name: 'Intermediate (mid-career)' }] },
    { id: 12, title: 'Session format', type: 'session', items: [{ id: 3, name: 'Talk' }] },
  ],
  rooms: [{ id: 7, name: 'Hall B' }],
};

describe('mapSessionize', () => {
  const sessions = mapSessionize(all, 'devconf', 'America/New_York');

  it('converts local times and skips unscheduled sessions', () => {
    expect(sessions.map((s) => s.id)).toEqual(['101', '102']);
    expect(sessions[1].start).toBe('2026-11-12T14:00:00.000Z');
  });

  it('maps categories, rooms and speakers', () => {
    const s = sessions[1];
    expect(s).toMatchObject({
      title: 'Shipping LLM features',
      abstract: 'Evals & guardrails',
      room: 'Hall B',
      type: 'Talk',
      tracks: ['AI'],
      levels: ['mid'],
      isFixed: false,
    });
    expect(s.speakers[0]).toEqual({
      name: 'Ada Lovelace',
      title: 'Staff Engineer',
      company: 'Analytical Engines',
      bio: 'Writes programs.',
      linkedIn: 'https://linkedin.com/in/ada',
    });
    expect(sessions[0].isFixed).toBe(true);
  });

  it('builds track groups from topic categories only', () => {
    expect(sessionizeTrackGroups(all)).toEqual([{ name: 'Track', tracks: ['AI'] }]);
  });
});

describe('splitTagLine', () => {
  it('handles "at", commas and plain titles', () => {
    expect(splitTagLine('PM @ Acme')).toEqual({ title: 'PM', company: 'Acme' });
    expect(splitTagLine('Designer, Studio X')).toEqual({ title: 'Designer', company: 'Studio X' });
    expect(splitTagLine('Founder')).toEqual({ title: 'Founder' });
    expect(splitTagLine(null)).toEqual({});
  });
});
