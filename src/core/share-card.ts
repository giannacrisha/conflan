// One-page image of a whole schedule (every day) to post or send to friends.
// Returned as an SVG string; the web app rasterizes it to PNG.

import { escapeXml, wrap } from './wallpaper';

export type ShareCardDay = { label: string; items: { time: string; title: string; room?: string }[] };

export type ShareCardInput = {
  eventName: string;
  /** "Gi's plan" style owner line; omitted when unknown */
  owner?: string;
  dates: string;
  days: ShareCardDay[];
  url?: string;
  /** Items listed per day before collapsing into "+N more" */
  perDay?: number;
  /** Event colors; defaults to the app theme */
  colors?: ShareCardColors;
};

export type ShareCardColors = { bg: string; panel: string; accent: string; onAccent: string };

export const CARD = { width: 1080, minHeight: 1350 };
const DEFAULT_COLORS: ShareCardColors = { bg: '#241C17', panel: '#33281F', accent: '#FFBE2E', onAccent: '#241C17' };

const SANS = "'Instrument Sans', -apple-system, 'Helvetica Neue', Arial, sans-serif";

export function shareCardSvg({
  eventName,
  owner,
  dates,
  days,
  url,
  perDay = 8,
  colors = DEFAULT_COLORS,
}: ShareCardInput) {
  const { width } = CARD;
  const { bg, panel, accent, onAccent } = colors;
  const pad = 72;
  const parts: string[] = [];
  const text = (x: number, y: number, size: number, fill: string, value: string, weight = 400, anchor = 'start') =>
    parts.push(
      `<text x="${x}" y="${y}" font-family="${SANS}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${escapeXml(value)}</text>`,
    );

  let y = pad + 24;
  text(pad, y, 26, accent, 'CONPLAN', 700);
  text(width - pad, y, 24, 'rgba(255,255,255,0.6)', dates, 500, 'end');
  y += 76;
  for (const line of wrap(eventName, 30, 2)) {
    text(pad, y, 52, '#FFFFFF', line, 700);
    y += 62;
  }
  const total = days.reduce((n, d) => n + d.items.length, 0);
  y += 6;
  // Stat pill, like a progress tag: "12 sessions · 3 days"
  const stat = `${total} session${total === 1 ? '' : 's'} · ${days.length} day${days.length === 1 ? '' : 's'}`;
  const statW = stat.length * 16 + 48;
  parts.push(`<rect x="${pad}" y="${y}" width="${statW}" height="52" rx="26" fill="${accent}"/>`);
  text(pad + 24, y + 34, 26, onAccent, stat, 700);
  if (owner) text(pad + statW + 20, y + 34, 26, 'rgba(255,255,255,0.75)', owner, 500);
  y += 92;

  for (const day of days) {
    const shown = day.items.slice(0, perDay);
    const rows = shown.map((it) => ({ ...it, lines: wrap(it.title, 34, 2) }));
    const bodyH = rows.reduce((h, r) => h + 40 + r.lines.length * 36 + (r.room ? 30 : 0) + 18, 0);
    const more = day.items.length - shown.length;
    const cardH = 84 + bodyH + (more > 0 ? 44 : 0) + 12;
    parts.push(`<rect x="${pad}" y="${y}" width="${width - pad * 2}" height="${cardH}" rx="36" fill="${panel}"/>`);
    text(pad + 36, y + 56, 30, accent, day.label, 700);
    text(width - pad - 36, y + 56, 24, 'rgba(255,255,255,0.5)', `${day.items.length}`, 600, 'end');
    let ry = y + 84;
    for (const r of rows) {
      text(pad + 36, ry + 30, 24, 'rgba(255,255,255,0.6)', r.time, 600);
      let ly = ry + 30;
      for (const line of r.lines) {
        ly += 36;
        text(pad + 36, ly, 30, '#FFFFFF', line, 500);
      }
      if (r.room) {
        ly += 30;
        text(pad + 36, ly, 22, 'rgba(255,255,255,0.5)', r.room);
      }
      ry = ly + 18 + 10;
    }
    if (more > 0) text(pad + 36, ry + 24, 24, accent, `+ ${more} more`, 600);
    y += cardH + 24;
  }

  y += 24;
  if (url) text(pad, y, 22, 'rgba(255,255,255,0.55)', url, 500);
  const height = Math.max(CARD.minHeight, y + pad);

  return {
    width,
    height,
    svg: [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
      `<rect width="100%" height="100%" fill="${bg}"/>`,
      ...parts,
      '</svg>',
    ].join(''),
  };
}
