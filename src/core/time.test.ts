import { describe, expect, it } from 'vitest';
import { dayKey, formatDay, formatTime, minuteOfDay, utcStringToIso, zonedToUtc } from './time';

const LA = 'America/Los_Angeles';

describe('time', () => {
  it('converts event-local time to UTC during PDT', () => {
    expect(zonedToUtc('2026-10-23 08:30:00', LA)).toBe('2026-10-23T15:30:00.000Z');
  });

  it('handles the switch to PST on Nov 1', () => {
    expect(zonedToUtc('2026-11-02 09:00', LA)).toBe('2026-11-02T17:00:00.000Z');
  });

  it('parses RainFocus UTC strings', () => {
    expect(utcStringToIso('2026/10/27 16:30:00')).toBe('2026-10-27T16:30:00.000Z');
  });

  it('reads day, minute and label in the event zone', () => {
    const late = '2026-10-29T05:30:00.000Z'; // 10:30 PM on Oct 28 in LA
    expect(dayKey(late, LA)).toBe('2026-10-28');
    expect(minuteOfDay(late, LA)).toBe(22 * 60 + 30);
    expect(formatTime('2026-10-28T16:00:00.000Z', LA)).toBe('9:00 AM');
  });
});

describe('formatDay', () => {
  it('formats day keys without shifting the date', () => {
    expect(formatDay('2026-10-28')).toBe('Wed 28');
    expect(formatDay('2026-10-28', 'long')).toBe('Wednesday, Oct 28');
  });
});
