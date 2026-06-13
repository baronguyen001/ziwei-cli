import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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

describe('cli run()', () => {
  const savedKey = process.env.TUVI_AI_API_KEY;

  beforeEach(() => {
    delete process.env.TUVI_AI_API_KEY;
  });
  afterEach(() => {
    if (savedKey === undefined) delete process.env.TUVI_AI_API_KEY;
    else process.env.TUVI_AI_API_KEY = savedKey;
  });

  it('prints help with no args', async () => {
    const c = capture();
    expect(await run([], c.io)).toBe(0);
    expect(c.out.join('\n')).toContain('Zi Wei Dou Shu');
  });

  it('prints the version', async () => {
    const c = capture();
    expect(await run(['--version'], c.io)).toBe(0);
    expect(c.out.join('\n')).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('lists the birth hours', async () => {
    const c = capture();
    expect(await run(['hours'], c.io)).toBe(0);
    const text = c.out.join('\n');
    expect(text).toContain('Tý');
    expect(text).toContain('Hợi');
  });

  it('computes a chart as text', async () => {
    const c = capture();
    const code = await run(
      ['chart', '--date', '1990-05-20', '--hour', '6', '--gender', 'male'],
      c.io,
    );
    expect(code).toBe(0);
    expect(c.out.join('\n')).toContain('ZI WEI DOU SHU CHART');
  });

  it('computes a chart as JSON', async () => {
    const c = capture();
    const code = await run(
      ['chart', '--date', '1990-05-20', '--hour', '6', '--gender', 'female', '--format', 'json'],
      c.io,
    );
    expect(code).toBe(0);
    const parsed = JSON.parse(c.out.join('\n'));
    expect(parsed.palaces).toHaveLength(12);
    expect(parsed.gender).toBe('female');
  });

  it('errors on a missing required flag', async () => {
    const c = capture();
    const code = await run(['chart', '--hour', '6', '--gender', 'male'], c.io);
    expect(code).toBe(1);
    expect(c.err.join('\n')).toContain('--date is required');
  });

  it('errors on a bad format', async () => {
    const c = capture();
    const code = await run(
      ['chart', '--date', '1990-05-20', '--hour', '6', '--gender', 'male', '--format', 'xml'],
      c.io,
    );
    expect(code).toBe(1);
    expect(c.err.join('\n')).toContain('--format must be');
  });

  it('errors on an unknown command', async () => {
    const c = capture();
    const code = await run(['frobnicate'], c.io);
    expect(code).toBe(1);
    expect(c.err.join('\n')).toContain('Unknown command');
  });

  it('read without a key explains how to set one', async () => {
    const c = capture();
    const code = await run(
      ['read', '--date', '1990-05-20', '--hour', '6', '--gender', 'male'],
      c.io,
    );
    expect(code).toBe(1);
    expect(c.err.join('\n')).toContain('TUVI_AI_API_KEY');
  });
});
