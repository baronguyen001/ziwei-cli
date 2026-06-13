import { describe, it, expect, vi } from 'vitest';
import { calculateChart } from '../src/chart.js';
import { interpretChart, SECTIONS, type ChatClient } from '../src/ai.js';

const chart = calculateChart({ date: '1990-05-20', hourIndex: 6, gender: 'male' });

/** A fake client that echoes which system/user prompt it received. */
function fakeClient(impl?: ChatClient['chat']): ChatClient {
  return {
    chat:
      impl ??
      ((_system, _user) => Promise.resolve('A thoughtful reading.')),
  };
}

describe('interpretChart', () => {
  it('generates all six sections by default', async () => {
    const client = fakeClient();
    const results = await interpretChart(chart, { client });
    expect(results).toHaveLength(SECTIONS.length);
    expect(results.every((r) => !r.failed)).toBe(true);
    expect(results.map((r) => r.key)).toEqual(SECTIONS.map((s) => s.key));
  });

  it('honours a requested subset of sections, in order', async () => {
    const results = await interpretChart(chart, {
      client: fakeClient(),
      sections: ['advice', 'overview'],
    });
    expect(results.map((r) => r.key)).toEqual(['advice', 'overview']);
  });

  it('ignores unknown section keys', async () => {
    const results = await interpretChart(chart, {
      client: fakeClient(),
      // @ts-expect-error — feeding a bad key on purpose.
      sections: ['overview', 'nope'],
    });
    expect(results.map((r) => r.key)).toEqual(['overview']);
  });

  it('passes the chart data and language into the prompt', async () => {
    const chat = vi.fn(async (_system: string, user: string) => {
      expect(user).toContain('CHART DATA:');
      expect(user).toContain('English');
      return 'ok';
    });
    await interpretChart(chart, { client: { chat }, lang: 'en', sections: ['overview'] });
    expect(chat).toHaveBeenCalledOnce();
  });

  it('captures a failing section instead of aborting the rest', async () => {
    let calls = 0;
    const client: ChatClient = {
      chat: async () => {
        calls += 1;
        if (calls === 1) throw new Error('rate limited');
        return 'recovered';
      },
    };
    const results = await interpretChart(chart, {
      client,
      sections: ['overview', 'career'],
    });
    expect(results[0]?.failed).toBe(true);
    expect(results[0]?.content).toContain('rate limited');
    expect(results[1]?.failed).toBe(false);
    expect(results[1]?.content).toBe('recovered');
  });

  it('reports progress for each section', async () => {
    const seen: string[] = [];
    await interpretChart(chart, {
      client: fakeClient(),
      sections: ['overview', 'advice'],
      onProgress: (_done, _total, title) => seen.push(title),
    });
    expect(seen).toEqual(['Overview', 'Summary & Advice']);
  });
});
