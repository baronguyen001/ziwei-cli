import { describe, it, expect } from 'vitest';
import { calculateChart } from '../src/chart.js';
import { analyzeChart, formatAnalysis } from '../src/analyze.js';

const chart = calculateChart({
  date: '1990-05-20',
  hourIndex: 6,
  gender: 'male',
  lang: 'en-US',
});

describe('analyzeChart', () => {
  it('summarizes brightness and star classes deterministically', () => {
    const a1 = analyzeChart(chart);
    const a2 = analyzeChart(chart);
    expect(a1).toEqual(a2);

    const starCount = chart.palaces.reduce(
      (sum, p) => sum + p.majorStars.length + p.minorStars.length + p.adjectiveStars.length,
      0,
    );
    const brightnessTotal = Object.values(a1.brightnessCounts).reduce((sum, n) => sum + n, 0);
    expect(brightnessTotal).toBe(starCount);
    expect(a1.majorStars.auspicious + a1.majorStars.inauspicious + a1.majorStars.neutral).toBe(
      chart.palaces.reduce((sum, p) => sum + p.majorStars.length, 0),
    );
    expect(a1.minorStars.auspicious + a1.minorStars.inauspicious + a1.minorStars.neutral).toBe(
      chart.palaces.reduce((sum, p) => sum + p.minorStars.length, 0),
    );
  });

  it('identifies empty palaces and their opposite borrowing palace', () => {
    const analysis = analyzeChart(chart);
    expect(analysis.emptyPalaces.length).toBeGreaterThan(0);
    for (const empty of analysis.emptyPalaces) {
      expect(chart.palaces[empty.index]?.majorStars).toHaveLength(0);
      expect(empty.borrowedFrom.index).toBe((empty.index + 6) % 12);
    }
  });

  it('produces one compact summary per palace', () => {
    const analysis = analyzeChart(chart);
    expect(analysis.palaceSummaries).toHaveLength(12);
    for (const summary of analysis.palaceSummaries) {
      expect(summary.total).toBe(summary.major + summary.minor + summary.adjective);
    }
  });
});

describe('formatAnalysis', () => {
  const analysis = analyzeChart(chart);

  it('renders text with structural disclaimer', () => {
    const out = formatAnalysis(analysis);
    expect(out).toContain('STRUCTURAL ANALYSIS');
    expect(out).toContain('not advice');
  });

  it('renders markdown and JSON', () => {
    expect(formatAnalysis(analysis, { format: 'markdown' })).toMatch(/^# Structural analysis/m);
    expect(JSON.parse(formatAnalysis(analysis, { format: 'json' }))).toEqual(analysis);
  });

  it('renders self-contained HTML without scripts', () => {
    const html = formatAnalysis(analysis, { format: 'html' });
    expect(html).toContain('<style>');
    expect(html).toContain('Zi Wei Structural Analysis');
    expect(html).not.toContain('<script');
  });
});
