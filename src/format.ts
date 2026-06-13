import type { Chart, Palace, Star } from './types.js';

/** Rendering format for {@link formatChart}. */
export type ChartFormat = 'text' | 'markdown' | 'json';

export interface FormatOptions {
  format?: ChartFormat;
}

function renderStar(star: Star): string {
  const parts = [star.name];
  if (star.brightness) parts.push(`(${star.brightness})`);
  if (star.mutagen) parts.push(`[Hóa ${star.mutagen}]`);
  return parts.join(' ');
}

function renderStarLine(label: string, stars: Star[]): string | null {
  if (stars.length === 0) return null;
  return `${label}: ${stars.map(renderStar).join(', ')}`;
}

function palaceLines(p: Palace): string[] {
  const header = `${p.name} (${p.heavenlyStem} ${p.earthlyBranch})${
    p.isBodyPalace ? ' · Thân' : ''
  }`;
  const lines = [header];
  for (const line of [
    renderStarLine('  Chính tinh', p.majorStars),
    renderStarLine('  Phụ tinh', p.minorStars),
    renderStarLine('  Tạp diệu', p.adjectiveStars),
  ]) {
    if (line) lines.push(line);
  }
  if (p.decadal) lines.push(`  Đại hạn: ${p.decadal.range}`);
  return lines;
}

function toText(chart: Chart): string {
  const out: string[] = [];
  out.push('=== ZI WEI DOU SHU CHART (Lá số Tử Vi) ===');
  out.push(`Solar date : ${chart.solarDate}`);
  if (chart.lunarDate) out.push(`Lunar date : ${chart.lunarDate}`);
  out.push(`Gender     : ${chart.gender}`);
  out.push(`Soul (Mệnh): ${chart.soul}`);
  out.push(`Body (Thân): ${chart.body}`);
  out.push(`Five-Elements Class: ${chart.fiveElementsClass}`);
  out.push('');
  out.push('--- 12 Palaces ---');
  for (const p of chart.palaces) {
    out.push('');
    out.push(...palaceLines(p));
  }
  return out.join('\n');
}

function toMarkdown(chart: Chart): string {
  const out: string[] = [];
  out.push('# Zi Wei Dou Shu Chart');
  out.push('');
  out.push(`- **Solar date:** ${chart.solarDate}`);
  if (chart.lunarDate) out.push(`- **Lunar date:** ${chart.lunarDate}`);
  out.push(`- **Gender:** ${chart.gender}`);
  out.push(`- **Soul (Mệnh):** ${chart.soul}`);
  out.push(`- **Body (Thân):** ${chart.body}`);
  out.push(`- **Five-Elements Class:** ${chart.fiveElementsClass}`);
  out.push('');
  out.push('## Palaces');
  for (const p of chart.palaces) {
    out.push('');
    out.push(
      `### ${p.name} (${p.heavenlyStem} ${p.earthlyBranch})${
        p.isBodyPalace ? ' · Thân' : ''
      }`,
    );
    for (const line of [
      renderStarLine('- Chính tinh', p.majorStars),
      renderStarLine('- Phụ tinh', p.minorStars),
      renderStarLine('- Tạp diệu', p.adjectiveStars),
    ]) {
      if (line) out.push(line);
    }
    if (p.decadal) out.push(`- Đại hạn: ${p.decadal.range}`);
  }
  return out.join('\n');
}

/**
 * Render a chart as plain text, Markdown, or pretty JSON.
 *
 * @param chart The chart returned by `calculateChart`.
 * @param opts  `format` defaults to `'text'`.
 */
export function formatChart(chart: Chart, opts: FormatOptions = {}): string {
  switch (opts.format ?? 'text') {
    case 'json':
      return JSON.stringify(chart, null, 2);
    case 'markdown':
      return toMarkdown(chart);
    case 'text':
    default:
      return toText(chart);
  }
}
