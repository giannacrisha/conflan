import { describe, expect, it } from 'vitest';
import { buildDays, findConflicts } from './slots';
import { makeSession as s } from './test-utils';

const LA = 'America/Los_Angeles';

describe('buildDays', () => {
  it('groups staggered overlapping sessions into one slot', () => {
    const [day] = buildDays(
      [
        s({ id: 'a', at: '10:15', until: '11:00' }),
        s({ id: 'b', at: '10:15', until: '11:15' }),
        s({ id: 'c', at: '10:20', until: '11:05' }),
        s({ id: 'd', at: '11:30', until: '12:15' }),
      ],
      LA,
    );
    expect(day.day).toBe('2026-10-28');
    expect(day.slots.map((x) => x.sessionIds)).toEqual([['a', 'b', 'c'], ['d']]);
    expect(day.slots[0].id).toBe('2026-10-28T1015');
  });

  it("doesn't let one long session chain separate blocks together", () => {
    const [day] = buildDays(
      [
        s({ id: 'mixer', at: '10:00', until: '11:30' }),
        s({ id: 'talk1', at: '10:15', until: '11:00' }),
        s({ id: 'talk2', at: '10:15', until: '11:00' }),
        s({ id: 'next', at: '11:10', until: '11:55' }),
      ],
      LA,
    );
    expect(day.slots.map((x) => x.sessionIds)).toEqual([['mixer', 'talk1', 'talk2'], ['next']]);
  });

  it('keeps fixed and all-day sessions out of slots', () => {
    const [day] = buildDays(
      [
        s({ id: 'lunch', at: '12:00', until: '13:00', isFixed: true }),
        s({ id: 'expo', at: '09:00', until: '15:00' }),
        s({ id: 'talk', at: '09:00', until: '09:45' }),
      ],
      LA,
    );
    expect(day.fixed.map((x) => x.id)).toEqual(['lunch']);
    expect(day.background.map((x) => x.id)).toEqual(['expo']);
    expect(day.slots.map((x) => x.sessionIds)).toEqual([['talk']]);
  });
});

describe('findConflicts', () => {
  it('flags overlapping picks only', () => {
    const picks = [
      s({ id: 'a', at: '09:00', until: '09:45' }),
      s({ id: 'b', at: '09:30', until: '10:15' }),
      s({ id: 'c', at: '10:15', until: '11:00' }),
    ];
    expect([...findConflicts(picks)].sort()).toEqual(['a', 'b']);
  });
});
