import { describe, expect, it } from 'vitest';
import { mapWhova, type WhAgenda } from './whova';

// Trimmed from a real get_agendas response: sessions sit inside nested
// time_ranges arrays, and talks inside a block live in `programs`.
const data: WhAgenda = {
  event_basics: { event_name: 'IA', timezone: 'America/Los_Angeles', is_virtual_event: false },
  agenda_tracks: [{ name: 'Projects & Practices' }, { name: 'Plenary' }],
  agenda: [
    {
      date: 'Oct 23, 2026',
      time_ranges: [
        ['08:30', [[{ sessions: [{ id: 1, name: 'Registration', calendar_stime: '2026-10-23 08:30:00', calendar_etime: '2026-10-23 16:00:00', place: 'Conference Center', tracks: [] }] }]]],
        ['09:30', [[{ sessions: [{ id: 2, name: 'Opening Plenary', calendar_stime: '2026-10-23 09:30:00', calendar_etime: '2026-10-23 10:45:00', tracks: [{ name: 'Plenary' }] }] }]]],
        [
          '12:15',
          [
            [
              {
                sessions: [
                  {
                    id: 3,
                    name: 'Projects and Practices 1 (Click subsessions to view all)',
                    desc: '<p>Four short projects</p>',
                    calendar_stime: '2026-10-23 12:15:00',
                    calendar_etime: '2026-10-23 13:30:00',
                    place: 'Ballroom B',
                    tracks: [{ name: 'Projects & Practices' }],
                    speaker: {},
                    programs: [
                      [
                        { id: 31, name: 'Storying Community', calendar_stime: '2026-10-23 12:15:00', calendar_etime: '2026-10-23 13:30:00', speaker: { Speaker: [{ name: 'Amber Abbas', aff: 'SAADA' }] } },
                        { id: 32, name: 'Desert Diaspora', calendar_stime: '2026-10-23 12:15:00', calendar_etime: '2026-10-23 13:30:00' },
                      ],
                    ],
                  },
                ],
              },
            ],
          ],
        ],
      ],
    },
  ],
};

describe('mapWhova', () => {
  const sessions = mapWhova(data, 'ia');
  const byId = Object.fromEntries(sessions.map((x) => [x.id, x]));

  it('finds every top-level session and converts local time to UTC', () => {
    expect(sessions.map((x) => x.id)).toEqual(['1', '2', '3']);
    expect(byId['3'].start).toBe('2026-10-23T19:15:00.000Z');
  });

  it('marks logistics and plenaries as fixed', () => {
    expect(byId['1'].isFixed).toBe(true);
    expect(byId['2'].isFixed).toBe(true);
    expect(byId['3'].isFixed).toBe(false);
  });

  it('folds subsessions into the block', () => {
    const block = byId['3'];
    expect(block.title).toBe('Projects and Practices 1');
    expect(block.tracks).toEqual(['Projects & Practices']);
    expect(block.abstract).toBe('Four short projects\n\nIncludes:\n• Storying Community (Amber Abbas)\n• Desert Diaspora');
    expect(block.speakers).toEqual([{ name: 'Amber Abbas', company: 'SAADA', title: undefined }]);
  });
});
