import { describe, expect, it } from 'vitest';
import { EVENTS } from '../events.config';
import { buildTheme, contrast, mix } from './palette';

describe('mix and contrast', () => {
  it('blends and measures colors', () => {
    expect(mix('#000000', '#FFFFFF', 0.5)).toBe('#808080');
    expect(mix('#123456', '#FFFFFF', 0)).toBe('#123456');
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21);
    expect(contrast('#777777', '#777777')).toBeCloseTo(1);
  });
});

describe('buildTheme', () => {
  it('picks readable text for light and dark highlights', () => {
    expect(buildTheme({ ink: '#0B6B5E', accent: '#F4A6C8', bg: '#E4EDF2' }).onAccent).not.toBe('#FFFFFF');
    expect(buildTheme({ ink: '#0B6B5E', accent: '#7A1E4E', bg: '#E4EDF2' }).onAccent).toBe('#FFFFFF');
  });

  // Every configured event variant must stay readable
  const variants = EVENTS.flatMap((e) => (e.theme.variants ?? []).map((v) => ({ event: e.id, ...v })));
  it.each(variants)('$event $name keeps text readable', (v) => {
    const t = buildTheme(v);
    expect(contrast(t.ink, t.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.white, t.ink)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.body, t.surface)).toBeGreaterThanOrEqual(7);
    expect(contrast(t.muted, t.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.onAccent, t.accent)).toBeGreaterThanOrEqual(4.5);
  });
});
