import { describe, it, expect } from 'vitest';
import type { Chart, Palace } from '../src/types.js';
import { analyzeElements, formatElements } from '../src/elements.js';

function palace(branch: string, stars: number): Palace {
  return {
    name: branch,
    heavenlyStem: '',
    earthlyBranch: branch,
    isBodyPalace: false,
    majorStars: Array.from({ length: stars }, (_, i) => ({ name: `s${i}` })),
    minorStars: [],
    adjectiveStars: [],
    decadal: null,
  };
}

function chart(branches: Array<[string, number]>): Chart {
  return {
    solarDate: '1990-05-20',
    lunarDate: '',
    gender: 'female',
    soul: '',
    body: '',
    fiveElementsClass: 'Water second class',
    palaces: branches.map(([branch, stars]) => palace(branch, stars)),
  };
}

describe('analyzeElements', () => {
  it('weights branch elements by palace star count across supported languages', () => {
    const report = analyzeElements(
      chart([
        ['Dần', 2],
        ['卯', 3],
        ['si', 4],
        ['午', 1],
        ['Thân', 5],
        ['you', 1],
        ['Hợi', 2],
        ['zi', 2],
        ['辰', 4],
        ['Tuất', 1],
        ['chou', 3],
        ['unknown-branch', 7],
      ]),
    );
    expect(report.counts).toEqual({ kim: 6, moc: 5, thuy: 4, hoa: 5, tho: 8 });
    expect(report.unknown).toBe(7);
    expect(report.rawBranchTally).toHaveLength(12);
    expect(report.dominant).toEqual(['tho']);
    expect(report.deficient).toEqual(['thuy']);
    expect(report.balanceScore).toBe(88);
    expect(report.fiveElementsClass).toBe('Water second class');
  });

  it('handles zero-star charts and includes zero deficient elements', () => {
    const report = analyzeElements(chart([['Dần', 0], ['Tý', 0]]));
    expect(report.balanceScore).toBe(100);
    expect(report.dominant).toEqual(['kim', 'moc', 'thuy', 'hoa', 'tho']);
    expect(report.deficient).toEqual(['kim', 'moc', 'thuy', 'hoa', 'tho']);
  });
});

describe('formatElements', () => {
  const report = analyzeElements(chart([['Dần', 2], ['Tý', 1], ['辰', 3]]));

  it('renders text and markdown with score and disclaimer', () => {
    expect(formatElements(report)).toContain('FIVE-ELEMENT BRANCH BALANCE');
    expect(formatElements(report, { format: 'markdown' })).toContain('Structural digest only');
  });

  it('renders JSON and self-contained HTML', () => {
    expect(JSON.parse(formatElements(report, { format: 'json' }))).toEqual(report);
    const html = formatElements(report, { format: 'html' });
    expect(html).toContain('<style>');
    expect(html).toContain('Zi Wei Five-Element Balance');
    expect(html).not.toContain('<script');
  });
});
