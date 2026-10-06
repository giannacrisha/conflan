import type { Session } from './types';

// Minimal RFC 5545 writer. Times are UTC, so calendar apps convert them to
// the viewer's zone without needing a VTIMEZONE block.

const CRLF = '\r\n';

function icsDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function escapeText(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Lines longer than 75 octets continue on the next line after a space */
function fold(line: string) {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = '';
  for (const ch of line) {
    const limit = out.length === 0 ? 75 : 74;
    if (encoder.encode(cur + ch).length > limit) {
      out.push(cur);
      cur = ch;
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.join(CRLF + ' ');
}

export function toIcs(
  sessions: Session[],
  { calendarName, now = new Date() }: { calendarName: string; now?: Date },
): string {
  const stamp = icsDate(now.toISOString());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//conflan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ];
  for (const s of sessions) {
    const speakers = s.speakers
      .map((p) => [p.name, p.company].filter(Boolean).join(', '))
      .join('; ');
    const description = [speakers && `Speakers: ${speakers}`, s.abstract, s.sourceUrl]
      .filter(Boolean)
      .join('\n\n');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${s.eventId}-${s.id}@conflan`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(s.start)}`,
      `DTEND:${icsDate(s.end)}`,
      `SUMMARY:${escapeText(s.title)}`,
    );
    if (s.room) lines.push(`LOCATION:${escapeText(s.room)}`);
    if (description) lines.push(`DESCRIPTION:${escapeText(description)}`);
    if (s.sourceUrl) lines.push(`URL:${s.sourceUrl}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join(CRLF) + CRLF;
}
