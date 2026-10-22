// Social formats of a schedule: LinkedIn (landscape teaser, square full plan)
// and Instagram Story (whole trip, or one story per day). Each returns SVG
// strings the web app rasterizes to PNG, painted in the event's colors.

import { shareCardSvg, type ShareCardColors, type ShareCardDay, type ShareCardInput } from './share-card';
import { escapeXml, wrap } from './wallpaper';

export type ShareFormat = 'portrait' | 'linkedin-wide' | 'linkedin-square' | 'story' | 'story-days';

export const SHARE_FORMATS: { id: ShareFormat; label: string; hint: string }[] = [
  { id: 'portrait', label: 'Full plan', hint: 'Every day on one tall image' },
  { id: 'linkedin-wide', label: 'LinkedIn wide', hint: '“Where to find me” with your highlights' },
  { id: 'linkedin-square', label: 'LinkedIn square', hint: 'Your plan in day columns' },
  { id: 'story', label: 'Story', hint: 'The whole trip on one Instagram story' },
  { id: 'story-days', label: 'Story per day', hint: 'One Instagram story for each day' },
];

export type ShareImage = { name: string; width: number; height: number; svg: string };

/** `days[].label` is "Friday, Oct 23"; `weekday`/`date` feed the big day numbers */
export type ShareFormatDay = ShareCardDay & { weekday: string; date: string };
export type ShareFormatInput = Omit<ShareCardInput, 'days' | 'colors'> & {
  days: ShareFormatDay[];
  colors: ShareCardColors;
};

const SANS = "'Instrument Sans', -apple-system, 'Helvetica Neue', Arial, sans-serif";
const WHITE = '#FFFFFF';
const dim = (o: number) => `rgba(255,255,255,${o})`;

/** Characters that fit in `width` px at `size` px, for the greedy wrapper */
const fit = (width: number, size: number) => Math.floor(width / (size * 0.52));

function canvas(width: number, height: number, bg: string) {
  const parts: string[] = [];
  return {
    text(x: number, y: number, size: number, fill: string, value: string, weight = 400, anchor = 'start') {
      parts.push(
        `<text x="${x}" y="${y}" font-family="${SANS}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${escapeXml(value)}</text>`,
      );
    },
    rect(x: number, y: number, w: number, h: number, r: number, fill: string) {
      parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`);
    },
    circle(cx: number, cy: number, r: number, fill: string) {
      parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`);
    },
    /** Draws wrapped lines and returns the y after the last one */
    lines(
      x: number,
      y: number,
      size: number,
      lh: number,
      fill: string,
      value: string,
      width: number,
      max: number,
      weight = 600,
    ) {
      for (const line of wrap(value, fit(width, size), max)) {
        this.text(x, y, size, fill, line, weight);
        y += lh;
      }
      return y;
    },
    pill(x: number, y: number, size: number, fill: string, color: string, value: string) {
      const w = Math.round(value.length * size * 0.56 + size * 1.6);
      const h = Math.round(size * 1.9);
      this.rect(x, y, w, h, h / 2, fill);
      this.text(x + size * 0.8, y + h * 0.66, size, color, value, 700);
      return w;
    },
    svg: () =>
      [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
        `<rect width="100%" height="100%" fill="${bg}"/>`,
        ...parts,
        '</svg>',
      ].join(''),
  };
}

const count = (days: ShareFormatInput['days']) => {
  const n = days.reduce((s, d) => s + d.items.length, 0);
  return `${n} session${n === 1 ? '' : 's'} · ${days.length} day${days.length === 1 ? '' : 's'}`;
};

/** Up to `n` sessions spread across days, earliest first within each day */
export function highlights(days: ShareFormatInput['days'], n: number) {
  const out: { day: ShareFormatDay; item: ShareFormatDay['items'][number] }[] = [];
  for (let i = 0; out.length < n && days.some((d) => d.items[i]); i++) {
    for (const day of days) if (day.items[i] && out.length < n) out.push({ day, item: day.items[i] });
  }
  return out.sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day));
}

function linkedinWide(input: ShareFormatInput): ShareImage {
  const [W, H, P] = [1200, 627, 56];
  const { bg, panel, accent, onAccent } = input.colors;
  const c = canvas(W, H, bg);
  c.text(P, P + 22, 18, accent, 'CONPLAN', 700);
  c.text(P, P + 78, 26, dim(0.75), "I'll be at the", 500);
  let y = c.lines(P, P + 132, 46, 52, WHITE, input.eventName, 450, 3, 700);
  c.text(P, y + 8, 24, dim(0.8), input.dates, 500);
  c.pill(P, H - P - 92, 22, accent, onAccent, count(input.days));
  const who = input.owner?.replace(/[’']s plan$/, '');
  c.text(P, H - P - 10, 20, dim(0.75), who ? `${who} · say hi if you’re going too` : 'Say hi if you’re going too', 500);

  const [px, pw] = [578, W - 578 - P];
  c.rect(px, P, pw, H - P * 2, 32, panel);
  c.text(px + 32, P + 48, 16, accent, 'WHERE TO FIND ME', 700);
  y = P + 92;
  const picks = highlights(input.days, 4);
  for (const { day, item } of picks) {
    c.text(px + 32, y, 18, accent, `${day.weekday.toUpperCase()} ${day.date}`, 700);
    c.text(px + 32, y + 22, 16, dim(0.7), item.time, 500);
    const end = c.lines(px + 144, y, 21, 26, WHITE, item.title, pw - 176, 2);
    y = Math.max(end, y + 44) + 20;
  }
  const more = input.days.reduce((s, d) => s + d.items.length, 0) - picks.length;
  if (more > 0) c.text(px + 32, y + 4, 17, accent, `+ ${more} more on my plan`, 600);
  return { name: 'linkedin', width: W, height: H, svg: c.svg() };
}

function linkedinSquare(input: ShareFormatInput): ShareImage {
  const [W, P] = [1080, 64];
  const { bg, panel, accent, onAccent } = input.colors;
  const c = canvas(W, W, bg);
  c.text(P, P + 22, 22, accent, 'CONPLAN', 700);
  c.text(W - P, P + 22, 22, dim(0.7), input.dates, 500, 'end');
  let y = c.lines(P, P + 104, 60, 66, WHITE, input.eventName, W - P * 2, 2, 700);
  const pw = c.pill(P, y - 18, 24, accent, onAccent, count(input.days));
  if (input.owner) c.text(P + pw + 18, y + 12, 24, dim(0.8), input.owner, 500);
  y += 66;

  const days = input.days.slice(0, 4);
  const gap = 16;
  const cw = (W - P * 2 - gap * (days.length - 1)) / days.length;
  const bottom = W - P - 44;
  days.forEach((d, i) => {
    const x = P + i * (cw + gap);
    c.rect(x, y, cw, bottom - y, 28, panel);
    c.text(x + 24, y + 58, 40, accent, d.date, 700);
    c.text(x + 34 + d.date.length * 26, y + 58, 18, accent, d.weekday.toUpperCase(), 700);
    let iy = y + 104;
    let shown = 0;
    for (const it of d.items) {
      const need = 24 + Math.min(3, wrap(it.title, fit(cw - 48, 19), 3).length) * 23 + 18;
      if (iy + need > bottom - 40) break;
      c.text(x + 24, iy, 15, dim(0.65), it.time, 600);
      iy = c.lines(x + 24, iy + 24, 19, 23, WHITE, it.title, cw - 48, 3) + 18;
      shown++;
    }
    if (shown < d.items.length) c.text(x + 24, iy + 4, 16, accent, `+ ${d.items.length - shown} more`, 600);
  });
  c.text(P, W - P, 18, dim(0.55), input.url ? `Planned with Conplan · ${input.url}` : 'Planned with Conplan', 500);
  return { name: 'linkedin-square', width: W, height: W, svg: c.svg() };
}

// Instagram draws its own UI over the top ~250px and bottom ~340px of a story
const STORY = { width: 1080, height: 1920, top: 260, bottom: 1920 - 350, pad: 72 };

function storyAll(input: ShareFormatInput): ShareImage {
  const { width: W, height: H, top, bottom, pad: P } = STORY;
  const { bg, panel, accent, onAccent } = input.colors;
  const c = canvas(W, H, bg);
  c.text(P, top + 26, 26, accent, 'MY PLAN FOR', 700);
  let y = c.lines(P, top + 110, 72, 78, WHITE, input.eventName, W - P * 2, 2, 700);
  c.pill(P, y - 30, 26, accent, onAccent, input.dates);
  y += 50;
  const perDay = input.days.length > 3 ? 2 : 3;
  for (const d of input.days) {
    const rows = d.items.slice(0, perDay).map((it) => ({ ...it, lines: wrap(it.title, fit(W - P * 2 - 200, 24), 2) }));
    const more = d.items.length - rows.length;
    const h = 76 + rows.reduce((s, r) => s + r.lines.length * 29 + 14, 0) + (more > 0 ? 34 : 0) + 12;
    if (y + h > bottom - 40) break;
    c.rect(P, y, W - P * 2, h, 32, panel);
    c.text(P + 32, y + 50, 28, accent, d.label, 700);
    let ry = y + 92;
    for (const r of rows) {
      c.text(P + 32, ry, 22, dim(0.65), r.time, 600);
      for (const line of r.lines) {
        c.text(P + 182, ry, 24, WHITE, line, 600);
        ry += 29;
      }
      ry += 14;
    }
    if (more > 0) c.text(P + 32, ry + 6, 20, accent, `+ ${more} more`, 600);
    y += h + 18;
  }
  if (input.owner) c.text(P, Math.min(y + 30, bottom - 10), 22, dim(0.6), `${input.owner} · planned with Conplan`, 500);
  return { name: 'story', width: W, height: H, svg: c.svg() };
}

function storyDay(input: ShareFormatInput, index: number): ShareImage {
  const { width: W, height: H, top, bottom, pad: P } = STORY;
  const { bg, accent, onAccent } = input.colors;
  const d = input.days[index];
  const c = canvas(W, H, bg);
  c.text(P, top + 30, 24, accent, input.eventName.toUpperCase().slice(0, 44), 700);
  const label = `Day ${index + 1} of ${input.days.length}`;
  const lw = Math.round(label.length * 22 * 0.56 + 22 * 1.6);
  c.pill(W - P - lw, top, 22, accent, onAccent, label);
  c.text(P - 8, top + 250, 220, accent, d.date, 700);
  const nx = P + d.date.length * 136 + 28;
  c.text(nx, top + 170, 64, WHITE, d.label.split(',')[0], 700);
  c.text(nx, top + 214, 28, dim(0.7), d.label.split(', ')[1]?.split(' ')[0] ?? '', 500);
  let y = top + 340;
  let shown = 0;
  for (const [i, it] of d.items.entries()) {
    const titleLines = wrap(it.title, fit(W - P * 2 - 60, 32), 2);
    const h = 32 + titleLines.length * 37 + (it.room ? 30 : 0) + 34;
    if (y + h > bottom - 40) break;
    if (i < d.items.length - 1) c.rect(P + 12, y + 14, 3, h, 1.5, dim(0.35));
    c.circle(P + 13, y + 6, 13, i === 0 ? accent : WHITE);
    c.text(P + 60, y + 14, 24, i === 0 ? accent : dim(0.7), it.time, 600);
    let ty = y + 52;
    for (const line of titleLines) {
      c.text(P + 60, ty, 32, WHITE, line, 700);
      ty += 37;
    }
    if (it.room) c.text(P + 60, ty - 4, 22, dim(0.55), it.room, 500);
    y += h;
    shown++;
  }
  if (shown < d.items.length) c.text(P + 60, y + 10, 24, accent, `+ ${d.items.length - shown} more`, 600);
  return { name: `story-day${index + 1}`, width: W, height: H, svg: c.svg() };
}

/** Every image a format produces; "story-days" makes one per day */
export function renderShare(format: ShareFormat, input: ShareFormatInput): ShareImage[] {
  switch (format) {
    case 'portrait': {
      const { svg, width, height } = shareCardSvg(input);
      return [{ name: 'plan', width, height, svg }];
    }
    case 'linkedin-wide':
      return [linkedinWide(input)];
    case 'linkedin-square':
      return [linkedinSquare(input)];
    case 'story':
      return [storyAll(input)];
    case 'story-days':
      return input.days.map((_, i) => storyDay(input, i));
  }
}
