import { describe, expect, it } from 'vitest';
import { wallpaperSvg, wrap } from './wallpaper';

describe('wrap', () => {
  it('wraps on words and ellipsizes the last kept line', () => {
    expect(wrap('one two three four', 9, 3)).toEqual(['one two', 'three', 'four']);
    expect(wrap('one two three four', 9, 2)).toEqual(['one two', 'three…']);
  });
});

describe('wallpaperSvg', () => {
  const base = { eventName: 'GHC 26', dayLabel: 'Wednesday, Oct 28', accent: '#41263F' };

  it('escapes text and includes each item', () => {
    const svg = wallpaperSvg({
      ...base,
      items: [{ time: '9:00 AM', title: 'Agents & <Pipelines>', room: '206AB' }],
    });
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('Agents &amp; &lt;Pipelines&gt;');
    expect(svg).toContain('206AB');
    expect(svg).not.toContain('more in Conflan');
  });

  it('notes items that do not fit', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({ time: '9:00 AM', title: `Talk ${i}`, room: 'Hall' }));
    expect(wallpaperSvg({ ...base, items })).toMatch(/\+ \d+ more in Conflan/);
  });
});
