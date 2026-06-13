import { describe, it, expect } from 'vitest';
import { calculateChart } from '../src/chart.js';
import { formatChart } from '../src/format.js';
import type { Chart } from '../src/types.js';

const chart: Chart = calculateChart({ date: '1990-05-20', hourIndex: 6, gender: 'male' });

describe('formatChart', () => {
  it('defaults to text format', () => {
    const out = formatChart(chart);
    expect(out).toContain('ZI WEI DOU SHU CHART');
    expect(out).toContain('Five-Elements Class:');
    expect(out).toContain('12 Palaces');
  });

  it('produces valid JSON that round-trips to the same chart', () => {
    const json = formatChart(chart, { format: 'json' });
    const parsed = JSON.parse(json) as Chart;
    expect(parsed.palaces).toHaveLength(12);
    expect(parsed.soul).toBe(chart.soul);
  });

  it('produces Markdown with headings', () => {
    const md = formatChart(chart, { format: 'markdown' });
    expect(md).toMatch(/^# Zi Wei Dou Shu Chart/m);
    expect(md).toMatch(/^## Palaces/m);
    expect(md).toMatch(/^### /m);
  });

  it('renders every palace name in text output', () => {
    const out = formatChart(chart, { format: 'text' });
    for (const p of chart.palaces) {
      expect(out).toContain(p.name);
    }
  });

  it('marks the body palace in text output', () => {
    const out = formatChart(chart, { format: 'text' });
    expect(out).toContain('· Thân');
  });

  it('renders star brightness and mutagen annotations when present', () => {
    const star = {
      name: 'Tử Vi',
      brightness: 'miếu',
      mutagen: 'Lộc',
    };
    const custom: Chart = {
      ...chart,
      palaces: [
        {
          name: 'Mệnh',
          heavenlyStem: 'Giáp',
          earthlyBranch: 'Tý',
          isBodyPalace: false,
          majorStars: [star],
          minorStars: [],
          adjectiveStars: [],
          decadal: { range: '6-15', heavenlyStem: 'Giáp', earthlyBranch: 'Tý' },
        },
      ],
    };
    const out = formatChart(custom, { format: 'text' });
    expect(out).toContain('Tử Vi (miếu) [Hóa Lộc]');
    expect(out).toContain('Đại hạn: 6-15');
  });
});
