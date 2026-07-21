import { describe, it, expect } from 'vitest';
import { run, type CliIO } from '../src/cli.js';

function capture(): { io: CliIO; out: string[]; err: string[] } {
  const out: string[] = [];
  const err: string[] = [];
  return {
    io: { log: (m) => out.push(m), error: (m) => err.push(m) },
    out,
    err,
  };
}

describe('cli v0.4 commands', () => {
  it('prints the bumped version', async () => {
    const c = capture();
    expect(await run(['--version'], c.io)).toBe(0);
    expect(c.out.join('\n')).toBe('0.4.0');
  });

  it('runs horoscope as JSON with a bare target year', async () => {
    const c = capture();
    const code = await run(
      [
        'horoscope',
        '--date',
        '1990-05-20',
        '--hour',
        '6',
        '--gender',
        'male',
        '--target',
        '2030',
        '--format',
        'json',
        '--lang',
        'en',
      ],
      c.io,
    );
    expect(code).toBe(0);
    const parsed = JSON.parse(c.out.join('\n'));
    expect(parsed.targetDate).toBe('2030-05-20');
    expect(parsed.annualTransformations).toHaveLength(4);
  });

  it('runs analyze as text without an AI key', async () => {
    const c = capture();
    const code = await run(
      ['analyze', '--date', '1990-05-20', '--hour', '6', '--gender', 'male'],
      c.io,
    );
    expect(code).toBe(0);
    expect(c.out.join('\n')).toContain('STRUCTURAL ANALYSIS');
    expect(c.out.join('\n')).toContain('not advice');
  });

  it('runs mutagen and elements without an AI key', async () => {
    const mutagen = capture();
    expect(
      await run(
        ['mutagen', '--date', '1990-05-20', '--hour', '6', '--gender', 'male', '--format', 'json'],
        mutagen.io,
      ),
    ).toBe(0);
    expect(JSON.parse(mutagen.out.join('\n')).counts).toEqual({
      loc: 1,
      quyen: 1,
      khoa: 1,
      ky: 1,
    });

    const elements = capture();
    expect(
      await run(
        ['elements', '--date', '1990-05-20', '--hour', '6', '--gender', 'male', '--lang', 'en'],
        elements.io,
      ),
    ).toBe(0);
    expect(elements.out.join('\n')).toContain('FIVE-ELEMENT BRANCH BALANCE');
  });

  it('wires batch CSV output', async () => {
    const c = capture();
    const code = await run(
      ['batch', '--input', 'test/fixtures/cohort_bad.csv', '--format', 'csv'],
      c.io,
    );
    expect(code).toBe(1);
    expect(c.out.join('\n')).toContain('date,hour,gender,label,ok,soul,body,fiveElementsClass,error');
    expect(c.out.join('\n')).toContain(',false,,,,');
  });

  it('runs cohort as JSON from batch input', async () => {
    const c = capture();
    const code = await run(
      ['cohort', '--input', 'test/fixtures/cohort.csv', '--format', 'json'],
      c.io,
    );
    expect(code).toBe(0);
    const parsed = JSON.parse(c.out.join('\n'));
    expect(parsed.labels).toEqual(['alpha', 'beta', 'gamma']);
    expect(parsed.size).toBe(3);
    expect(parsed.rankedPairs).toHaveLength(3);
  });

  it('reports bad cohort rows without producing a partial matrix', async () => {
    const c = capture();
    const code = await run(
      ['cohort', '--input', 'test/fixtures/cohort_bad.csv', '--format', 'json'],
      c.io,
    );
    expect(code).toBe(1);
    expect(c.out).toEqual([]);
    expect(c.err.join('\n')).toContain('row 2');
    expect(c.err.join('\n')).toContain('date');
  });
});
