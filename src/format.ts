import type { Chart, Palace, Star } from './types.js';

/** Rendering format for {@link formatChart}. */
export type ChartFormat = 'text' | 'markdown' | 'json' | 'html';

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

/** HTML-escape the few characters that matter inside element text. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function starHtml(star: Star): string {
  const cls = star.mutagen ? ' class="mutagen"' : '';
  const parts = [esc(star.name)];
  if (star.brightness) parts.push(`<span class="bright">(${esc(star.brightness)})</span>`);
  if (star.mutagen) parts.push(`<span class="hua">[Hóa ${esc(star.mutagen)}]</span>`);
  return `<li${cls}>${parts.join(' ')}</li>`;
}

function starGroupHtml(label: string, stars: Star[]): string {
  if (stars.length === 0) return '';
  return `<div class="grp"><span class="lbl">${label}</span><ul>${stars
    .map(starHtml)
    .join('')}</ul></div>`;
}

function palaceHtml(p: Palace): string {
  const body = p.isBodyPalace ? '<span class="badge">Thân</span>' : '';
  const decadal = p.decadal
    ? `<div class="decadal">Đại hạn ${esc(p.decadal.range)}</div>`
    : '';
  return [
    `<article class="palace${p.isBodyPalace ? ' body' : ''}">`,
    `<header><h3>${esc(p.name)}</h3>${body}<span class="stem">${esc(p.heavenlyStem)} ${esc(
      p.earthlyBranch,
    )}</span></header>`,
    starGroupHtml('Chính tinh', p.majorStars),
    starGroupHtml('Phụ tinh', p.minorStars),
    starGroupHtml('Tạp diệu', p.adjectiveStars),
    decadal,
    `</article>`,
  ].join('');
}

/**
 * Render a chart as a self-contained HTML document: a summary header plus the
 * twelve palaces as a responsive card grid. The output has **no JavaScript and
 * no external assets** (all CSS is inlined), so it works offline and can be
 * saved or emailed as-is.
 */
function toHtml(chart: Chart): string {
  const meta = [
    ['Solar date', chart.solarDate],
    ['Lunar date', chart.lunarDate],
    ['Gender', chart.gender],
    ['Soul (Mệnh)', chart.soul],
    ['Body (Thân)', chart.body],
    ['Five-Elements Class', chart.fiveElementsClass],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(String(v))}</dd></div>`)
    .join('');
  const palaces = chart.palaces.map(palaceHtml).join('\n');
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Zi Wei Dou Shu Chart — ${esc(chart.solarDate)}</title>
<style>
:root{--bg:#0f1117;--card:#1a1d27;--ink:#e7e9ee;--mut:#9aa1b1;--acc:#c9a227;--hua:#e0533d}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:24px}
h1{font-size:20px;margin:0 0 4px}
.sub{color:var(--mut);margin:0 0 16px}
dl.meta{display:flex;flex-wrap:wrap;gap:8px 24px;margin:0 0 24px;padding:16px;background:var(--card);border-radius:12px}
dl.meta dt{color:var(--mut);font-size:12px}
dl.meta dd{margin:0;font-weight:600}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.palace{background:var(--card);border:1px solid #272b38;border-radius:12px;padding:12px}
.palace.body{border-color:var(--acc)}
.palace header{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.palace h3{font-size:15px;margin:0}
.palace .stem{margin-left:auto;color:var(--mut);font-size:12px}
.badge{background:var(--acc);color:#1a1d27;font-size:10px;font-weight:700;padding:1px 6px;border-radius:6px}
.grp{margin:4px 0}
.grp .lbl{color:var(--mut);font-size:11px;text-transform:uppercase;letter-spacing:.04em}
.grp ul{list-style:none;margin:2px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:4px 8px}
.grp li{font-size:13px}
.grp li.mutagen{color:var(--acc)}
.bright{color:var(--mut)}
.hua{color:var(--hua);font-size:11px}
.decadal{margin-top:6px;color:var(--mut);font-size:12px}
footer{color:var(--mut);font-size:12px;margin-top:24px}
</style>
</head>
<body>
<h1>Zi Wei Dou Shu Chart</h1>
<p class="sub">Lá số Tử Vi · ${esc(chart.solarDate)}</p>
<dl class="meta">${meta}</dl>
<section class="grid">
${palaces}
</section>
<footer>Generated by ziwei-cli — deterministic, offline.</footer>
</body>
</html>`;
}

/**
 * Render a chart as plain text, Markdown, pretty JSON, or a self-contained HTML
 * document.
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
    case 'html':
      return toHtml(chart);
    case 'text':
    default:
      return toText(chart);
  }
}
