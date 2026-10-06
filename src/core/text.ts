import type { SessionLevel } from './types';

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  ndash: '–',
  mdash: '—',
  hellip: '…',
};

/** Plain text from the HTML abstracts that platforms return */
export function stripHtml(html: string | undefined | null): string | undefined {
  if (!html) return undefined;
  const text = html
    .replace(/<(br|\/p|\/li|\/div)\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();
  return text || undefined;
}

/** Map a platform's career-level label onto our shared levels */
export function normalizeLevel(label: string): SessionLevel[] {
  const l = label.toLowerCase();
  if (l === 'all') return ['all'];
  const out: SessionLevel[] = [];
  if (l.includes('student')) out.push('student');
  if (l.includes('early')) out.push('early');
  if (l.includes('mid')) out.push('mid');
  if (l.includes('senior') || l.includes('exec')) out.push('senior');
  return out;
}

export function uniq<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}

/** Trims long text at a word boundary */
export function clip(text: string | undefined, max: number): string | undefined {
  if (!text || text.length <= max) return text;
  return text.slice(0, text.lastIndexOf(' ', max)).trimEnd() + '…';
}
