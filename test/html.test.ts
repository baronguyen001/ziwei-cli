import { describe, it, expect } from 'vitest';
import { calculateChart } from '../src/chart.js';
import { formatChart } from '../src/format.js';

const chart = calculateChart({ date: '1990-05-20', hourIndex: 6, gender: 'male' });

describe('formatChart html', () => {
  it('produces a self-contained HTML document', () => {
    const html = formatChart(chart, { format: 'html' });
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<style>');
    // no external assets / scripts
    expect(html).not.toContain('<script');
    expect(html).not.toContain('http://');
    expect(html).not.toMatch(/src="https?:/);
  });

  it('renders every palace name', () => {
    const html = formatChart(chart, { format: 'html' });
    for (const p of chart.palaces) {
      expect(html).toContain(p.name);
    }
  });

  it('marks the body palace and shows the summary fields', () => {
    const html = formatChart(chart, { format: 'html' });
    expect(html).toContain('class="badge"');
    expect(html).toContain('Five-Elements Class');
    expect(html).toContain(chart.solarDate);
  });

  it('escapes angle brackets and ampersands in chart data', () => {
    const html = formatChart(
      { ...chart, soul: '<a> & <b>' },
      { format: 'html' },
    );
    expect(html).toContain('&lt;a&gt; &amp; &lt;b&gt;');
    expect(html).not.toContain('<a> & <b>');
  });
});
