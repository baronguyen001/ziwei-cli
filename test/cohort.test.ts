import { describe, it, expect } from 'vitest';
import { calculateChart } from '../src/chart.js';
import { compareCharts } from '../src/compare.js';
import { compareCohort, formatCohort } from '../src/cohort.js';

const charts = [
  calculateChart({ date: '1990-05-20', hourIndex: 6, gender: 'male', lang: 'en-US' }),
  calculateChart({ date: '1988-11-02', hourIndex: 3, gender: 'female', lang: 'en-US' }),
  calculateChart({ date: '1995-03-14', hourIndex: 9, gender: 'male', lang: 'en-US' }),
];
const labels = ['alpha', 'beta', 'gamma'];

describe('compareCohort', () => {
  it('builds a symmetric affinity matrix by reusing pair comparison scores', () => {
    const result = compareCohort(charts);
    expect(result.size).toBe(3);
    expect(result.matrix).toHaveLength(3);
    expect(result.matrix[0]?.[0]?.affinity).toBe(100);
    expect(result.matrix[0]?.[0]?.comparison).toBeNull();

    const expected = compareCharts(charts[0]!, charts[1]!);
    expect(result.matrix[0]?.[1]?.affinity).toBe(expected.affinity);
    expect(result.matrix[1]?.[0]?.affinity).toBe(expected.affinity);
    expect(result.matrix[0]?.[1]?.comparison).toEqual(expected);
  });

  it('ranks pairs by descending affinity with stable index tie-breaks', () => {
    const result = compareCohort(charts);
    expect(result.rankedPairs).toHaveLength(3);
    const affinities = result.rankedPairs.map((p) => p.affinity);
    expect(affinities).toEqual([...affinities].sort((a, b) => b - a));
  });

  it('handles a one-chart cohort', () => {
    const result = compareCohort([charts[0]!]);
    expect(result.rankedPairs).toEqual([]);
    expect(result.matrix[0]?.[0]?.affinity).toBe(100);
  });
});

describe('formatCohort', () => {
  const result = compareCohort(charts);

  it('renders text with labels and the no-advice note', () => {
    const out = formatCohort(result, labels);
    expect(out).toContain('COHORT AFFINITY');
    expect(out).toContain('alpha');
    expect(out).toContain('not advice');
  });

  it('renders markdown and JSON', () => {
    expect(formatCohort(result, labels, { format: 'markdown' })).toMatch(/^# Cohort affinity/m);
    const parsed = JSON.parse(formatCohort(result, labels, { format: 'json' }));
    expect(parsed.labels).toEqual(labels);
    expect(parsed.size).toBe(3);
  });

  it('renders self-contained HTML without scripts', () => {
    const html = formatCohort(result, labels, { format: 'html' });
    expect(html).toContain('<style>');
    expect(html).toContain('Zi Wei Cohort Affinity');
    expect(html).not.toContain('<script');
  });
});
