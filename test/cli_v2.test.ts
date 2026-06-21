import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

const dir = mkdtempSync(join(tmpdir(), 'ziwei-'));

describe('cli v0.2 commands', () => {
  it('renders a chart as HTML', async () => {
    const c = capture();
    const code = await run(
      ['chart', '--date', '1990-05-20', '--hour', '6', '--gender', 'male', '--format', 'html'],
      c.io,
    );
    expect(code).toBe(0);
    expect(c.out.join('\n')).toContain('<!doctype html>');
  });

  it('runs a CSV batch to JSONL', async () => {
    const file = join(dir, 'births.csv');
    writeFileSync(
      file,
      'date,hour,gender,lang,label\n1990-05-20,6,male,vi,a\n1988-11-02,3,female,en,b\n',
    );
    const c = capture();
    const code = await run(['batch', '--input', file], c.io);
    expect(code).toBe(0);
    const lines = c.out.join('\n').split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]!).ok).toBe(true);
  });

  it('runs a JSON batch and exits 1 when a row fails', async () => {
    const file = join(dir, 'births.json');
    writeFileSync(
      file,
      JSON.stringify([
        { date: '1990-05-20', hour: 6, gender: 'male' },
        { date: 'bad', hour: 6, gender: 'male' },
      ]),
    );
    const c = capture();
    const code = await run(['batch', '--input', file, '--format', 'json'], c.io);
    expect(code).toBe(1);
    const parsed = JSON.parse(c.out.join('\n'));
    expect(parsed).toHaveLength(2);
    expect(parsed[1].ok).toBe(false);
  });

  it('errors when batch has no --input', async () => {
    const c = capture();
    const code = await run(['batch'], c.io);
    expect(code).toBe(1);
    expect(c.err.join('\n')).toContain('--input');
  });

  it('compares two charts as text', async () => {
    const c = capture();
    const code = await run(
      [
        'compare',
        '--date1', '1990-05-20', '--hour1', '6', '--gender1', 'male',
        '--date2', '1988-11-02', '--hour2', '3', '--gender2', 'female',
      ],
      c.io,
    );
    expect(code).toBe(0);
    expect(c.out.join('\n')).toContain('CHART COMPARISON');
  });

  it('compares two charts as JSON', async () => {
    const c = capture();
    const code = await run(
      [
        'compare',
        '--date1', '1990-05-20', '--hour1', '6', '--gender1', 'male',
        '--date2', '1990-05-20', '--hour2', '6', '--gender2', 'male',
        '--format', 'json',
      ],
      c.io,
    );
    expect(code).toBe(0);
    const parsed = JSON.parse(c.out.join('\n'));
    expect(parsed.affinity).toBe(100);
  });
});
