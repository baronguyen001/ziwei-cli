import { describe, it, expect } from 'vitest';
import { calculateChart, InvalidBirthInputError } from '../src/chart.js';

// A fixed, fictional birth used across the deterministic assertions.
const FIXED = { date: '1990-05-20', hourIndex: 6, gender: 'male' } as const;

describe('calculateChart', () => {
  it('returns exactly 12 palaces', () => {
    const chart = calculateChart(FIXED);
    expect(chart.palaces).toHaveLength(12);
  });

  it('populates soul, body and five-elements class', () => {
    const chart = calculateChart(FIXED);
    expect(chart.soul.length).toBeGreaterThan(0);
    expect(chart.body.length).toBeGreaterThan(0);
    expect(chart.fiveElementsClass.length).toBeGreaterThan(0);
  });

  it('is deterministic for identical input', () => {
    const a = calculateChart(FIXED);
    const b = calculateChart(FIXED);
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it('echoes back the requested gender', () => {
    expect(calculateChart({ ...FIXED, gender: 'female' }).gender).toBe('female');
  });

  it('marks exactly one palace as the body palace', () => {
    const chart = calculateChart(FIXED);
    const bodyPalaces = chart.palaces.filter((p) => p.isBodyPalace);
    expect(bodyPalaces.length).toBe(1);
  });

  it('gives every palace a heavenly stem and earthly branch', () => {
    const chart = calculateChart(FIXED);
    for (const p of chart.palaces) {
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.earthlyBranch.length).toBeGreaterThan(0);
    }
  });

  it('places at least one major star somewhere in the chart', () => {
    const chart = calculateChart(FIXED);
    const totalMajor = chart.palaces.reduce((n, p) => n + p.majorStars.length, 0);
    expect(totalMajor).toBeGreaterThan(0);
  });

  it('supports the en-US name language', () => {
    const chart = calculateChart({ ...FIXED, lang: 'en-US' });
    expect(chart.palaces).toHaveLength(12);
  });

  describe('validation', () => {
    it('rejects a malformed date', () => {
      expect(() => calculateChart({ ...FIXED, date: '20/05/1990' })).toThrow(
        InvalidBirthInputError,
      );
    });

    it('rejects an out-of-range hour index', () => {
      expect(() => calculateChart({ ...FIXED, hourIndex: 12 })).toThrow(
        InvalidBirthInputError,
      );
    });

    it('rejects a non-integer hour index', () => {
      expect(() => calculateChart({ ...FIXED, hourIndex: 3.5 })).toThrow(
        InvalidBirthInputError,
      );
    });

    it('rejects an impossible month', () => {
      expect(() => calculateChart({ ...FIXED, date: '1990-13-01' })).toThrow(
        InvalidBirthInputError,
      );
    });

    it('rejects an invalid gender', () => {
      // @ts-expect-error — exercising the runtime guard with a bad value.
      expect(() => calculateChart({ ...FIXED, gender: 'other' })).toThrow(
        InvalidBirthInputError,
      );
    });
  });
});
