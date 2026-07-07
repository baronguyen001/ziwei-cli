import { describe, it, expect } from 'vitest';
import { calculateHoroscope, formatHoroscope } from '../src/horoscope.js';

const input = { date: '1990-05-20', hourIndex: 6, gender: 'male' as const, lang: 'en-US' as const };

describe('calculateHoroscope', () => {
  it('calculates deterministic decadal and annual timing for a target date', () => {
    const h1 = calculateHoroscope(input, '2026-07-07');
    const h2 = calculateHoroscope(input, '2026-07-07');
    expect(h1).toEqual(h2);
    expect(h1.targetDate).toBe('2026-07-07');
    expect(h1.decadal.index).toBeGreaterThanOrEqual(0);
    expect(h1.annual.index).toBeGreaterThanOrEqual(0);
    expect(h1.annualTransformations).toHaveLength(4);
    expect(h1.annualTransformations.map((t) => t.kind)).toEqual([
      'loc',
      'quyen',
      'khoa',
      'ky',
    ]);
    expect(h1.annualTransformations.every((t) => t.star.length > 0)).toBe(true);
  });

  it('expands a bare target year using the birth month and day', () => {
    const h = calculateHoroscope(input, '2030');
    expect(h.targetDate).toBe('2030-05-20');
  });

  it('throws a typed validation error for a bad target', () => {
    expect(() => calculateHoroscope(input, '2030/05/20')).toThrow(/targetDate/);
  });
});

describe('formatHoroscope', () => {
  const h = calculateHoroscope(input, '2026-07-07');

  it('renders text with the timing headings', () => {
    const out = formatHoroscope(h);
    expect(out).toContain('ZI WEI HOROSCOPE TIMING');
    expect(out).toContain('Annual four transformations');
  });

  it('renders markdown and JSON', () => {
    expect(formatHoroscope(h, { format: 'markdown' })).toMatch(/^# Zi Wei horoscope timing/m);
    expect(JSON.parse(formatHoroscope(h, { format: 'json' }))).toEqual(h);
  });

  it('renders self-contained HTML without scripts', () => {
    const html = formatHoroscope(h, { format: 'html' });
    expect(html).toContain('<style>');
    expect(html).not.toContain('<script');
    expect(html).toContain('Zi Wei Horoscope Timing');
  });
});
