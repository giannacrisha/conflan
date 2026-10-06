// Time zone helpers built on Intl, so we need no date library.
// All session times are stored in UTC and shown in the event's time zone.

const partsFormatter = new Map<string, Intl.DateTimeFormat>();

function zoneParts(utcMs: number, timeZone: string) {
  let fmt = partsFormatter.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    partsFormatter.set(timeZone, fmt);
  }
  const p: Record<string, string> = {};
  for (const { type, value } of fmt.formatToParts(new Date(utcMs))) p[type] = value;
  return {
    year: +p.year,
    month: +p.month,
    day: +p.day,
    hour: +p.hour,
    minute: +p.minute,
    second: +p.second,
  };
}

function offsetMs(utcMs: number, timeZone: string) {
  const p = zoneParts(utcMs, timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - utcMs;
}

/** "2026-10-23 08:30:00" in America/Los_Angeles -> "2026-10-23T15:30:00.000Z" */
export function zonedToUtc(local: string, timeZone: string): string {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) throw new Error(`Unparseable local time: ${local}`);
  const [, y, mo, d, h, mi, s = '0'] = m;
  const guess = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
  const first = offsetMs(guess, timeZone);
  let utc = guess - first;
  // Re-check once in case the guess crossed a DST change
  const second = offsetMs(utc, timeZone);
  if (second !== first) utc = guess - second;
  return new Date(utc).toISOString();
}

/** "2026/10/27 16:30:00" (already UTC) -> ISO */
export function utcStringToIso(utc: string): string {
  return new Date(utc.replace(/\//g, '-').replace(' ', 'T') + 'Z').toISOString();
}

/** Calendar day of an instant in the event zone, YYYY-MM-DD */
export function dayKey(iso: string, timeZone: string): string {
  const p = zoneParts(Date.parse(iso), timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** Minutes since local midnight in the event zone */
export function minuteOfDay(iso: string, timeZone: string): number {
  const p = zoneParts(Date.parse(iso), timeZone);
  return p.hour * 60 + p.minute;
}

/** "9:00 AM" in the event zone */
export function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

export function durationMinutes(start: string, end: string): number {
  return Math.round((Date.parse(end) - Date.parse(start)) / 60000);
}

/** "2026-10-28" -> "Wed 28" (short) or "Wednesday, Oct 28" (long) */
export function formatDay(day: string, style: 'short' | 'long' = 'short'): string {
  const date = new Date(`${day}T12:00:00Z`);
  if (style === 'long') {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short' }).format(date);
  return `${weekday} ${date.getUTCDate()}`;
}
