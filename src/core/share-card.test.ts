import { describe, expect, it } from 'vitest';
import { CARD, shareCardSvg } from './share-card';

const item = (title: string) => ({ time: '9:00 AM', title, room: 'Hall A' });

describe('shareCardSvg', () => {
  it('lists every day on one page with escaped text', () => {
    const { svg, width, height } = shareCardSvg({
      eventName: 'IA Gathering',
      owner: "Gi's plan",
      dates: 'Oct 23 to 25',
      days: [
        { label: 'Fri 23', items: [item('Maps & <Mazes>')] },
        { label: 'Sat 24', items: [item('Wayfinding')] },
      ],
      url: 'https://example.com/s',
    });
    expect(width).toBe(CARD.width);
    expect(height).toBeGreaterThanOrEqual(CARD.minHeight);
    expect(svg).toContain('Maps &amp; &lt;Mazes&gt;');
    expect(svg).toContain('Fri 23');
    expect(svg).toContain('Sat 24');
    expect(svg).toContain('2 sessions · 2 days');
    expect(svg).toContain('Gi&apos;s plan');
  });

  it('collapses long days and grows the page to fit', () => {
    const days = Array.from({ length: 4 }, (_, d) => ({
      label: `Day ${d}`,
      items: Array.from({ length: 12 }, (_, i) => item(`Talk ${i}`)),
    }));
    const { svg, height } = shareCardSvg({ eventName: 'X', dates: 'Oct', days, perDay: 5 });
    expect(svg.match(/\+ 7 more/g)).toHaveLength(4);
    expect(height).toBeGreaterThan(CARD.minHeight);
  });
});
