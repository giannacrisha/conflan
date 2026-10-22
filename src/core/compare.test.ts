import { describe, expect, it } from 'vitest';
import { compareSchedules, parsePicks, shareQuery } from './compare';
import { makeSession } from './test-utils';

describe('compareSchedules', () => {
  const a = makeSession({ id: 'a', at: '09:00', until: '10:00' });
  const b = makeSession({ id: 'b', at: '09:30', until: '10:30' });
  const c = makeSession({ id: 'c', at: '11:00', until: '12:00' });
  const d = makeSession({ id: 'd', at: '13:00', until: '14:00' });

  it('marks shared, free and clashing sessions', () => {
    const result = compareSchedules([c, b, a], [a, d]);
    expect(result.rows.map((r) => [r.session.id, r.status])).toEqual([
      ['a', 'both'],
      ['b', 'clash'],
      ['c', 'free'],
    ]);
    expect(result.rows[1].clashesWith.map((s) => s.id)).toEqual(['a']);
    expect([result.both, result.free, result.clash]).toEqual([1, 1, 1]);
  });

  it('treats everything as free when the viewer has no plan', () => {
    expect(compareSchedules([a, b], []).free).toBe(2);
  });
});

describe('share links', () => {
  it('round-trips picks and trims the name', () => {
    expect(shareQuery(['x1', 'y 2'], '  Gi ')).toBe('picks=x1,y%202&from=Gi');
    expect(shareQuery(['x1'])).toBe('picks=x1');
    expect(parsePicks('x1,,x1, y2 ')).toEqual(['x1', 'y2']);
    expect(parsePicks(undefined)).toEqual([]);
  });
});
