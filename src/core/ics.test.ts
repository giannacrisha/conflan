import { describe, expect, it } from 'vitest';
import { escapeText, toIcs } from './ics';
import { makeSession as s } from './test-utils';

describe('toIcs', () => {
  const ics = toIcs(
    [
      s({
        id: 'a',
        title: 'Interviews, Offers; and You',
        room: '252ABC',
        abstract: 'Line one\nLine two',
        speakers: [{ name: 'Ada Lovelace', company: 'Analytical Engines' }],
        sourceUrl: 'https://example.com/a',
      }),
    ],
    { calendarName: 'GHC 26', now: new Date('2026-10-01T00:00:00Z') },
  );
  const lines = ics.split('\r\n');

  it('writes a valid calendar wrapper with CRLF endings', () => {
    expect(lines[0]).toBe('BEGIN:VCALENDAR');
    expect(lines.at(-2)).toBe('END:VCALENDAR');
    expect(ics.endsWith('\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/\n/);
  });

  it('writes UTC times and escaped text', () => {
    expect(ics).toContain('DTSTART:20261028T160000Z');
    expect(ics).toContain('DTEND:20261028T164500Z');
    expect(ics).toContain('SUMMARY:Interviews\\, Offers\\; and You');
    expect(ics).toContain('LOCATION:252ABC');
  });

  it('folds long lines to 75 octets', () => {
    for (const line of lines) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(lines.some((l) => l.startsWith(' '))).toBe(true);
  });

  it('escapes backslashes before other characters', () => {
    expect(escapeText('a\\b,c')).toBe('a\\\\b\\,c');
  });
});
