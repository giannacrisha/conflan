import { describe, expect, it } from 'vitest';
import { highlights, renderShare, SHARE_FORMATS, type ShareFormatInput } from './share-formats';

const colors = { bg: '#0B6B5E', panel: '#237A6E', accent: '#F4A6C8', onAccent: '#123A33' };
const day = (label: string, weekday: string, date: string, titles: string[]) => ({
  label,
  weekday,
  date,
  items: titles.map((title, i) => ({ time: `${9 + i}:00 AM`, title, room: 'Hall A' })),
});
const input: ShareFormatInput = {
  eventName: 'IA National Gathering',
  owner: "Gi's plan",
  dates: 'Oct 23 to Oct 25',
  url: 'example.com/s',
  colors,
  days: [
    day('Friday, Oct 23', 'Fri', '23', ['Ourtopia & <Dreams>', 'Lotería', 'Mapping', 'Lila Downs', 'Extra']),
    day('Saturday, Oct 24', 'Sat', '24', ['Lightning Talks', 'Blooms']),
    day('Sunday, Oct 25', 'Sun', '25', ['Projects 9']),
  ],
};

describe('renderShare', () => {
  it.each(SHARE_FORMATS.map((f) => f.id))('%s renders escaped SVG in the event colors', (format) => {
    const images = renderShare(format, input);
    for (const img of images) {
      expect(img.svg.startsWith('<svg')).toBe(true);
      expect(img.svg).toContain('fill="#0B6B5E"');
      expect(img.svg).toContain('#F4A6C8');
      expect(img.svg).not.toContain('<circle cx="1040"');
    }
    expect(images.map((i) => i.svg).join('')).toMatch(/Ourtopia &amp; &lt;Dreams&gt;|Lightning Talks/);
  });

  it('uses the right sizes', () => {
    const size = (f: Parameters<typeof renderShare>[0]) => renderShare(f, input).map((i) => [i.width, i.height]);
    expect(size('linkedin-wide')).toEqual([[1200, 627]]);
    expect(size('linkedin-square')).toEqual([[1080, 1080]]);
    expect(size('story')).toEqual([[1080, 1920]]);
    expect(size('story-days')).toEqual([
      [1080, 1920],
      [1080, 1920],
      [1080, 1920],
    ]);
  });

  it('notes sessions that did not fit', () => {
    expect(renderShare('linkedin-wide', input)[0].svg).toContain('+ 4 more on my plan');
  });
});

describe('highlights', () => {
  it('spreads picks across days', () => {
    const picks = highlights(input.days, 4).map((p) => p.item.title);
    expect(picks).toEqual(['Ourtopia & <Dreams>', 'Lotería', 'Lightning Talks', 'Projects 9']);
  });
});
