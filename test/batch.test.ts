import { describe, it, expect } from 'vitest';
import {
  parseBatchCsv,
  parseBatchJson,
  calculateBatch,
  toJsonl,
  toCsv,
} from '../src/batch.js';

describe('parseBatchCsv', () => {
  it('parses rows with an optional header, comments and blank lines', () => {
    const csv = [
      '# a sample batch',
      'date,hour,gender,lang,label',
      '1990-05-20,6,male,vi,alice',
      '',
      '1988-11-02,3,female,en,bob',
    ].join('\n');
    const entries = parseBatchCsv(csv);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({
      label: 'alice',
      input: { date: '1990-05-20', hourIndex: 6, gender: 'male', lang: 'vi-VN' },
    });
    expect(entries[1]?.input.lang).toBe('en-US');
  });

  it('works without a header row or optional columns', () => {
    const entries = parseBatchCsv('1990-05-20,6,male');
    expect(entries).toHaveLength(1);
    expect(entries[0]?.input).toEqual({
      date: '1990-05-20',
      hourIndex: 6,
      gender: 'male',
    });
    expect(entries[0]?.label).toBeUndefined();
  });

  it('returns an empty array for empty input', () => {
    expect(parseBatchCsv('   \n # only comments')).toEqual([]);
  });

  it('throws on a too-short row', () => {
    expect(() => parseBatchCsv('1990-05-20,6')).toThrow(/at least/);
  });

  it('throws on a non-integer hour and a bad gender', () => {
    expect(() => parseBatchCsv('1990-05-20,x,male')).toThrow(/hour/);
    expect(() => parseBatchCsv('1990-05-20,6,other')).toThrow(/gender/);
  });
});

describe('parseBatchJson', () => {
  it('accepts hour or hourIndex and optional label/lang', () => {
    const json = JSON.stringify([
      { date: '1990-05-20', hour: 6, gender: 'male', label: 'a' },
      { date: '1988-11-02', hourIndex: 3, gender: 'female', lang: 'en' },
    ]);
    const entries = parseBatchJson(json);
    expect(entries[0]).toEqual({
      label: 'a',
      input: { date: '1990-05-20', hourIndex: 6, gender: 'male' },
    });
    expect(entries[1]?.input.lang).toBe('en-US');
  });

  it('throws on non-array JSON and non-object items', () => {
    expect(() => parseBatchJson('{}')).toThrow(/array/);
    expect(() => parseBatchJson('[1]')).toThrow(/not an object/);
  });

  it('rejects an unknown lang token', () => {
    expect(() =>
      parseBatchJson(JSON.stringify([{ date: '1990-05-20', hour: 6, gender: 'male', lang: 'fr' }])),
    ).toThrow(/lang/);
  });
});

describe('calculateBatch + toJsonl', () => {
  it('computes valid rows and captures bad ones without throwing', () => {
    const results = calculateBatch([
      { label: 'ok', input: { date: '1990-05-20', hourIndex: 6, gender: 'male' } },
      { label: 'bad', input: { date: 'nope', hourIndex: 6, gender: 'male' } },
    ]);
    expect(results).toHaveLength(2);
    const [ok, bad] = results;
    expect(ok?.ok).toBe(true);
    if (ok?.ok) {
      expect(ok.chart.palaces).toHaveLength(12);
      expect(ok.label).toBe('ok');
    }
    expect(bad?.ok).toBe(false);
    if (bad && !bad.ok) {
      expect(bad.error).toMatch(/date/);
      expect(bad.label).toBe('bad');
    }
  });

  it('serialises to one JSON object per line', () => {
    const results = calculateBatch(parseBatchCsv('1990-05-20,6,male\n1988-11-02,3,female'));
    const jsonl = toJsonl(results);
    const lines = jsonl.split('\n');
    expect(lines).toHaveLength(2);
    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });
});

describe('toCsv', () => {
  it('uses the documented stable column order', () => {
    expect(toCsv([])).toBe('date,hour,gender,label,ok,soul,body,fiveElementsClass,error');
  });

  it('escapes CSV fields and includes failed rows', () => {
    const results = calculateBatch([
      {
        label: 'ok, "quoted"',
        input: { date: '1990-05-20', hourIndex: 6, gender: 'male' },
      },
      { label: 'bad\nrow', input: { date: 'nope', hourIndex: 6, gender: 'female' } },
    ]);
    const csv = toCsv(results);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('date,hour,gender,label,ok,soul,body,fiveElementsClass,error');
    expect(lines[1]).toContain('"ok, ""quoted"""');
    expect(lines[1]).toContain(',true,');
    expect(csv).toContain('"bad\nrow"');
    expect(csv).toContain(',false,,,,');
    expect(csv).toContain('date must be in YYYY-MM-DD format');
  });
});
