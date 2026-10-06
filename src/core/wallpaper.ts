// Phone lock-screen wallpaper for one day of a schedule, as an SVG string.
// The web app rasterizes it to PNG; native can do the same later.

export type WallpaperItem = { time: string; title: string; room?: string };

export type WallpaperInput = {
  eventName: string;
  dayLabel: string;
  items: WallpaperItem[];
  accent: string;
  width?: number;
  height?: number;
};

const SANS = "-apple-system, 'Helvetica Neue', Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

export function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Greedy word wrap by character count; the last line gets an ellipsis if cut */
export function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (!line) line = word;
    else if ((line + ' ' + word).length <= maxChars) line += ' ' + word;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = kept[maxLines - 1].slice(0, maxChars - 1).trimEnd() + '…';
  return kept;
}

export function wallpaperSvg({
  eventName,
  dayLabel,
  items,
  accent,
  width = 1170,
  height = 2532,
}: WallpaperInput): string {
  const pad = 96;
  // The top third stays clear for the lock-screen clock
  let y = Math.round(height * 0.34);
  const bottom = height - 220;
  const parts: string[] = [];
  const text = (x: number, yy: number, size: number, fill: string, value: string, font = SANS, weight = 400) =>
    parts.push(
      `<text x="${x}" y="${yy}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeXml(value)}</text>`,
    );

  text(pad, y, 34, 'rgba(255,255,255,0.7)', eventName.toUpperCase(), SANS, 700);
  y += 84;
  text(pad, y, 72, '#FFFFFF', dayLabel, SERIF, 700);
  y += 70;

  let shown = 0;
  for (const item of items) {
    const titleLines = wrap(item.title, 38, 2);
    const blockHeight = 50 + titleLines.length * 52 + (item.room ? 44 : 0) + 40;
    if (y + blockHeight > bottom) break;
    parts.push(
      `<rect x="${pad}" y="${y}" width="6" height="${blockHeight - 40}" rx="3" fill="rgba(255,255,255,0.5)"/>`,
    );
    let ly = y + 36;
    text(pad + 32, ly, 32, 'rgba(255,255,255,0.75)', item.time, SANS, 700);
    for (const line of titleLines) {
      ly += 52;
      text(pad + 32, ly, 42, '#FFFFFF', line, SANS, 600);
    }
    if (item.room) {
      ly += 44;
      text(pad + 32, ly, 30, 'rgba(255,255,255,0.65)', item.room);
    }
    y += blockHeight;
    shown++;
  }
  if (shown < items.length) {
    text(pad, y + 20, 32, 'rgba(255,255,255,0.75)', `+ ${items.length - shown} more in Conflan`, SANS, 600);
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="#140B13"/></linearGradient></defs>`,
    `<rect width="100%" height="100%" fill="url(#bg)"/>`,
    ...parts,
    '</svg>',
  ].join('');
}
