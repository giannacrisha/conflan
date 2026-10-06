import { describe, expect, it, vi } from 'vitest';
import type { EventConfig } from '../core/types';
import { loadRainFocus, type RfItem } from './rainfocus';

const item = (n: number, over: Partial<RfItem> = {}): RfItem => ({
  sessionID: `s${n}`,
  sessionTimeID: `t${n}`,
  title: ` Talk ${n} `,
  type: 'Presentation',
  abstract: '<p>Learn &amp; grow</p>',
  times: [{ sessionTimeID: `t${n}`, utcStartTime: '2026/10/28 16:00:00', utcEndTime: '2026/10/28 16:45:00', room: '252ABC' }],
  attributevalues: [
    { attribute: 'Session Type', value: 'Presentation' },
    { attribute: 'Career Level', value: 'Student/Early Career' },
    { attribute: 'Content Pillar', value: 'Hire' },
    { attribute: 'Session Track: Hire', value: 'Job Search & Interview Readiness' },
    { attribute: 'Format Type', value: 'In-Person' },
  ],
  participants: [{ fullName: 'Ada Lovelace', jobTitle: 'Engineer', companyName: 'AWS' }],
  ...over,
});

const config: EventConfig = {
  id: 'ghc26',
  name: 'GHC',
  timezone: 'America/Los_Angeles',
  start: '2026-10-26',
  end: '2026-10-30',
  theme: { accent: '#41263F' },
  source: { platform: 'rainfocus', apiProfileId: 'p', widgetId: 'w', days: ['20261028'], catalogUrl: 'https://x/catalog' },
};

const json = (body: unknown) => ({ ok: true, json: async () => body }) as Response;

describe('loadRainFocus', () => {
  it('pages through both response shapes and maps fields', async () => {
    const page1 = Array.from({ length: 50 }, (_, i) => item(i));
    const page2 = [item(50, { attributevalues: [{ attribute: 'Session Type', value: 'Mainstage' }] })];
    const fetchFn = vi
      .fn()
      // First page is nested in sectionList, later pages are flat
      .mockResolvedValueOnce(json({ sectionList: [{ items: page1, total: 51 }], totalSearchItems: 51 }))
      .mockResolvedValueOnce(json({ items: page2, total: 51 }));

    const { event, sessions } = await loadRainFocus(config, fetchFn as unknown as typeof fetch);

    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(String(fetchFn.mock.calls[1][1].body)).toContain('from=50');
    expect(sessions).toHaveLength(51);
    expect(sessions[0]).toMatchObject({
      id: 's0-t0',
      title: 'Talk 0',
      abstract: 'Learn & grow',
      start: '2026-10-28T16:00:00.000Z',
      room: '252ABC',
      format: 'in-person',
      tracks: ['Job Search & Interview Readiness'],
      levels: ['student', 'early'],
      speakers: [{ name: 'Ada Lovelace', title: 'Engineer', company: 'AWS' }],
      isFixed: false,
      sourceUrl: 'https://x/catalog?tab.day=20261028',
    });
    expect(sessions[50].isFixed).toBe(true);
    expect(event.trackGroups).toEqual([{ name: 'Hire', tracks: ['Job Search & Interview Readiness'] }]);
  });

  it('splits repeat sessions by time and drops TBD rooms', async () => {
    const times = [
      { sessionTimeID: 'a', utcStartTime: '2026/10/27 16:30:00', utcEndTime: '2026/10/27 18:00:00', room: 'TBD' },
      { sessionTimeID: 'b', utcStartTime: '2026/10/27 21:00:00', utcEndTime: '2026/10/27 22:30:00', room: '210' },
    ];
    const items = [item(1, { sessionTimeID: 'a', times }), item(1, { sessionTimeID: 'b', times })];
    const fetchFn = vi.fn().mockResolvedValue(json({ sectionList: [{ items, total: 2 }] }));
    const { sessions } = await loadRainFocus(config, fetchFn as unknown as typeof fetch);
    expect(sessions.map((x) => [x.id, x.room])).toEqual([
      ['s1-a', undefined],
      ['s1-b', '210'],
    ]);
  });
});
