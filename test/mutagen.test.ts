import { describe, it, expect } from 'vitest';
import type { Chart } from '../src/types.js';
import { analyzeMutagens, formatMutagens } from '../src/mutagen.js';

function chart(): Chart {
  return {
    solarDate: '1990-05-20',
    lunarDate: '',
    gender: 'male',
    soul: 'soul',
    body: 'body',
    fiveElementsClass: 'class',
    palaces: [
      {
        name: 'Mệnh',
        heavenlyStem: '',
        earthlyBranch: 'Tý',
        isBodyPalace: false,
        majorStars: [{ name: 'A', mutagen: 'Lộc' }],
        minorStars: [{ name: 'B', mutagen: 'Quyền' }],
        adjectiveStars: [],
        decadal: null,
      },
      {
        name: 'career',
        heavenlyStem: '',
        earthlyBranch: 'mao',
        isBodyPalace: false,
        majorStars: [{ name: 'C', mutagen: 'C' }],
        minorStars: [{ name: 'D', mutagen: 'D' }],
        adjectiveStars: [],
        decadal: null,
      },
      {
        name: '财帛',
        heavenlyStem: '',
        earthlyBranch: '辰',
        isBodyPalace: false,
        majorStars: [{ name: 'E', mutagen: '禄' }],
        minorStars: [],
        adjectiveStars: [],
        decadal: null,
      },
    ],
  };
}

describe('analyzeMutagens', () => {
  it('normalizes Vietnamese, English and Chinese mutagen markers', () => {
    const report = analyzeMutagens(chart());
    expect(report.counts).toEqual({ loc: 2, quyen: 1, khoa: 1, ky: 1 });
    expect(report.transformations.loc.map((entry) => entry.star)).toEqual(['A', 'E']);
    expect(report.transformations.quyen[0]?.star).toBe('B');
    expect(report.transformations.khoa[0]?.star).toBe('C');
    expect(report.transformations.ky[0]?.star).toBe('D');
    expect(report.absent).toEqual([]);
  });

  it('flags Ky on a life-axis palace and reports absent markers', () => {
    const c = chart();
    c.palaces[1]!.name = 'friends';
    c.palaces[1]!.majorStars = [];
    c.palaces[1]!.minorStars = [{ name: 'D', mutagen: '忌' }];
    c.palaces[0]!.majorStars = [];
    c.palaces[0]!.minorStars = [];
    c.palaces[2]!.majorStars = [];
    const report = analyzeMutagens(c);
    expect(report.kyOnLifeAxis).toBe(false);
    expect(report.absent).toEqual(['loc', 'quyen', 'khoa']);
  });
});

describe('formatMutagens', () => {
  const report = analyzeMutagens(chart());

  it('renders text and markdown with the disclaimer', () => {
    expect(formatMutagens(report)).toContain('FOUR-TRANSFORMATIONS MAP');
    expect(formatMutagens(report, { format: 'markdown' })).toContain('Structural digest only');
  });

  it('renders JSON and self-contained HTML', () => {
    expect(JSON.parse(formatMutagens(report, { format: 'json' }))).toEqual(report);
    const html = formatMutagens(report, { format: 'html' });
    expect(html).toContain('<style>');
    expect(html).toContain('Zi Wei Four-Transformations');
    expect(html).not.toContain('<script');
  });
});
