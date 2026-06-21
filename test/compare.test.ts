import { describe, it, expect } from 'vitest';
import { calculateChart } from '../src/chart.js';
import { compareCharts, formatComparison } from '../src/compare.js';

const a = calculateChart({ date: '1990-05-20', hourIndex: 6, gender: 'male' });
const b = calculateChart({ date: '1988-11-02', hourIndex: 3, gender: 'female' });

describe('compareCharts', () => {
  it('reports identical fields when comparing a chart to itself', () => {
    const cmp = compareCharts(a, a);
    expect(cmp.sameSoul).toBe(true);
    expect(cmp.sameBody).toBe(true);
    expect(cmp.sameFiveElements).toBe(true);
    expect(cmp.affinity).toBe(100);
    // every major star is common to itself
    expect(cmp.commonMajorStars.length).toBeGreaterThan(0);
    expect(cmp.sharedPositions.length).toBeGreaterThan(0);
  });

  it('is deterministic and bounds affinity to 0..100', () => {
    const c1 = compareCharts(a, b);
    const c2 = compareCharts(a, b);
    expect(c1).toEqual(c2);
    expect(c1.affinity).toBeGreaterThanOrEqual(0);
    expect(c1.affinity).toBeLessThanOrEqual(100);
  });

  it('keeps common stars sorted', () => {
    const cmp = compareCharts(a, b);
    const sorted = [...cmp.commonMajorStars].sort();
    expect(cmp.commonMajorStars).toEqual(sorted);
  });
});

describe('formatComparison', () => {
  it('renders text by default with an affinity line and disclaimer', () => {
    const out = formatComparison(compareCharts(a, b));
    expect(out).toContain('CHART COMPARISON');
    expect(out).toMatch(/Affinity \(illustrative\): \d+\/100/);
    expect(out).toContain('not advice');
  });

  it('renders markdown headings', () => {
    const md = formatComparison(compareCharts(a, b), { format: 'markdown' });
    expect(md).toMatch(/^# Chart comparison/m);
    expect(md).toContain('> Affinity is a deterministic');
  });

  it('round-trips JSON', () => {
    const cmp = compareCharts(a, b);
    const json = formatComparison(cmp, { format: 'json' });
    expect(JSON.parse(json)).toEqual(cmp);
  });

  it('handles the no-shared-position case', () => {
    const empty = formatComparison({
      soulA: 'X',
      soulB: 'Y',
      sameSoul: false,
      bodyA: 'X',
      bodyB: 'Y',
      sameBody: false,
      fiveElementsA: 'a',
      fiveElementsB: 'b',
      sameFiveElements: false,
      commonMajorStars: [],
      sharedPositions: [],
      affinity: 0,
    });
    expect(empty).toContain('Shared positions (0)');
  });
});
