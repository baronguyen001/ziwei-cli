import type { Chart, Lang, Palace, Star } from './types.js';

/** Rendering format for {@link formatAnalysis}. */
export type AnalysisFormat = 'text' | 'markdown' | 'json' | 'html';

export interface AnalysisFormatOptions {
  format?: AnalysisFormat;
  lang?: Lang;
}

export interface StarClassTally {
  auspicious: number;
  inauspicious: number;
  neutral: number;
}

export interface EmptyPalace {
  index: number;
  name: string;
  borrowedFrom: {
    index: number;
    name: string;
  };
}

export interface PalaceStarSummary {
  index: number;
  name: string;
  major: number;
  minor: number;
  adjective: number;
  total: number;
}

export interface ChartAnalysis {
  solarDate: string;
  brightnessCounts: Record<string, number>;
  majorStars: StarClassTally;
  minorStars: StarClassTally;
  emptyPalaces: EmptyPalace[];
  palaceSummaries: PalaceStarSummary[];
  disclaimer: string;
}

const AUSPICIOUS_MAJOR = new Set([
  'Tử Vi',
  'Thiên Phủ',
  'Thiên Tướng',
  'Thiên Lương',
  'Thái Dương',
  'Thái Âm',
  'Thiên Cơ',
  'Thiên Đồng',
  'Vũ Khúc',
  'emperor',
  'empress',
  'minister',
  'sage',
  'sun',
  'moon',
  'advisor',
  'fortunate',
  'general',
  '紫微',
  '天府',
  '天相',
  '天梁',
  '太阳',
  '太阴',
  '天机',
  '天同',
  '武曲',
]);

const INAUSPICIOUS_MAJOR = new Set([
  'Phá Quân',
  'Thất Sát',
  'Tham Lang',
  'Cự Môn',
  'Liêm Trinh',
  'rebel',
  'marshal',
  'wolf',
  'advocator',
  'judge',
  '破军',
  '七杀',
  '贪狼',
  '巨门',
  '廉贞',
]);

const AUSPICIOUS_MINOR = new Set([
  'Văn Xương',
  'Văn Khúc',
  'Tả Phù',
  'Hữu Bật',
  'Thiên Khôi',
  'Thiên Việt',
  'Lộc Tồn',
  'Thiên Mã',
  'scholar',
  'artist',
  'officer',
  'helper',
  'assistant',
  'aide',
  'money',
  'horse',
  '文昌',
  '文曲',
  '左辅',
  '右弼',
  '天魁',
  '天钺',
  '禄存',
  '天马',
]);

const INAUSPICIOUS_MINOR = new Set([
  'Kình Dương',
  'Đà La',
  'Hỏa Tinh',
  'Linh Tinh',
  'Địa Không',
  'Địa Kiếp',
  'driven',
  'tangled',
  'impulsive',
  'spark',
  'ideologue',
  'fickle',
  '擎羊',
  '陀罗',
  '火星',
  '铃星',
  '地空',
  '地劫',
]);

const DISCLAIMER = 'Structural digest only; this is not advice.';

function allStars(p: Palace): Star[] {
  return [...p.majorStars, ...p.minorStars, ...p.adjectiveStars];
}

function tallyByClass(stars: Star[], good: Set<string>, hard: Set<string>): StarClassTally {
  const tally: StarClassTally = { auspicious: 0, inauspicious: 0, neutral: 0 };
  for (const star of stars) {
    if (good.has(star.name)) tally.auspicious += 1;
    else if (hard.has(star.name)) tally.inauspicious += 1;
    else tally.neutral += 1;
  }
  return tally;
}

function addBrightness(out: Record<string, number>, stars: Star[]): void {
  for (const star of stars) {
    const key = star.brightness || 'unknown';
    out[key] = (out[key] ?? 0) + 1;
  }
}

function oppositeIndex(index: number, size: number): number {
  return (index + Math.floor(size / 2)) % size;
}

function emptyPalaces(chart: Chart): EmptyPalace[] {
  return chart.palaces
    .map((palace, index) => ({ palace, index }))
    .filter(({ palace }) => palace.majorStars.length === 0)
    .map(({ palace, index }) => {
      const opposite = oppositeIndex(index, chart.palaces.length);
      return {
        index,
        name: palace.name,
        borrowedFrom: {
          index: opposite,
          name: chart.palaces[opposite]?.name ?? '',
        },
      };
    });
}

function palaceSummaries(chart: Chart): PalaceStarSummary[] {
  return chart.palaces.map((palace, index) => {
    const major = palace.majorStars.length;
    const minor = palace.minorStars.length;
    const adjective = palace.adjectiveStars.length;
    return {
      index,
      name: palace.name,
      major,
      minor,
      adjective,
      total: major + minor + adjective,
    };
  });
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tallyText(label: string, tally: StarClassTally): string {
  return `${label}: auspicious ${tally.auspicious}, inauspicious ${tally.inauspicious}, neutral ${tally.neutral}`;
}

function toText(a: ChartAnalysis): string {
  const out: string[] = ['=== STRUCTURAL ANALYSIS ===', ''];
  out.push(`Solar date: ${a.solarDate}`);
  out.push(DISCLAIMER);
  out.push('');
  out.push(`Brightness counts: ${JSON.stringify(a.brightnessCounts)}`);
  out.push(tallyText('Major stars', a.majorStars));
  out.push(tallyText('Minor stars', a.minorStars));
  out.push('');
  out.push(`Empty palaces (${a.emptyPalaces.length}):`);
  if (a.emptyPalaces.length === 0) out.push('  none');
  for (const p of a.emptyPalaces) {
    out.push(`  ${p.name} borrows opposite palace ${p.borrowedFrom.name}`);
  }
  out.push('');
  out.push('Per-palace star counts:');
  for (const p of a.palaceSummaries) {
    out.push(`  ${p.name}: major ${p.major}, minor ${p.minor}, adjective ${p.adjective}, total ${p.total}`);
  }
  return out.join('\n');
}

function toMarkdown(a: ChartAnalysis): string {
  const out: string[] = ['# Structural analysis', '', `Solar date: ${a.solarDate}`, '', `> ${DISCLAIMER}`, ''];
  out.push(`- **Brightness counts:** ${JSON.stringify(a.brightnessCounts)}`);
  out.push(`- **${tallyText('Major stars', a.majorStars)}**`);
  out.push(`- **${tallyText('Minor stars', a.minorStars)}**`);
  out.push('');
  out.push('## Empty palaces');
  if (a.emptyPalaces.length === 0) out.push('- none');
  for (const p of a.emptyPalaces) {
    out.push(`- ${p.name} borrows opposite palace ${p.borrowedFrom.name}`);
  }
  out.push('');
  out.push('## Per-palace star counts');
  out.push('| Palace | Major | Minor | Adjective | Total |');
  out.push('|---|---:|---:|---:|---:|');
  for (const p of a.palaceSummaries) {
    out.push(`| ${p.name} | ${p.major} | ${p.minor} | ${p.adjective} | ${p.total} |`);
  }
  return out.join('\n');
}

function toHtml(a: ChartAnalysis): string {
  const emptyRows =
    a.emptyPalaces.length === 0
      ? '<li>none</li>'
      : a.emptyPalaces
          .map((p) => `<li>${esc(p.name)} borrows ${esc(p.borrowedFrom.name)}</li>`)
          .join('');
  const summaryRows = a.palaceSummaries
    .map(
      (p) =>
        `<tr><td>${esc(p.name)}</td><td>${p.major}</td><td>${p.minor}</td><td>${p.adjective}</td><td>${p.total}</td></tr>`,
    )
    .join('');
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Zi Wei Structural Analysis - ${esc(a.solarDate)}</title>
<style>
:root{--bg:#111318;--panel:#1d222b;--ink:#edf0f5;--mut:#a8b0bd;--line:#303846;--acc:#e0a65a}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:24px}
h1{font-size:22px;margin:0 0 4px}
h2{font-size:16px;margin:22px 0 8px}
.sub,footer{color:var(--mut)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin:18px 0}
.stat{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:13px}
.label{color:var(--mut);font-size:12px;text-transform:uppercase}
.value{font-weight:700;margin-top:2px}
table{width:100%;border-collapse:collapse;background:var(--panel);border:1px solid var(--line);border-radius:8px;overflow:hidden}
th,td{text-align:right;padding:9px;border-bottom:1px solid var(--line)}
th:first-child,td:first-child{text-align:left}
th{color:var(--mut);font-size:12px;text-transform:uppercase}
tr:last-child td{border-bottom:0}
footer{font-size:12px;margin-top:20px}
</style>
</head>
<body>
<h1>Zi Wei Structural Analysis</h1>
<p class="sub">${esc(a.solarDate)} · ${esc(DISCLAIMER)}</p>
<section class="stats">
<div class="stat"><div class="label">Brightness</div><div class="value">${esc(JSON.stringify(a.brightnessCounts))}</div></div>
<div class="stat"><div class="label">Major stars</div><div class="value">${esc(tallyText('', a.majorStars).replace(/^: /, ''))}</div></div>
<div class="stat"><div class="label">Minor stars</div><div class="value">${esc(tallyText('', a.minorStars).replace(/^: /, ''))}</div></div>
</section>
<h2>Empty palaces</h2>
<ul>${emptyRows}</ul>
<h2>Per-palace star counts</h2>
<table><thead><tr><th>Palace</th><th>Major</th><th>Minor</th><th>Adjective</th><th>Total</th></tr></thead><tbody>${summaryRows}</tbody></table>
<footer>Generated by ziwei-cli - deterministic, offline, no key.</footer>
</body>
</html>`;
}

/**
 * Produce a deterministic structural digest of a chart. This summarizes star
 * counts and palace structure only; it does not provide advice or predictions.
 */
export function analyzeChart(chart: Chart): ChartAnalysis {
  const brightnessCounts: Record<string, number> = {};
  const majorStars = chart.palaces.flatMap((p) => p.majorStars);
  const minorStars = chart.palaces.flatMap((p) => p.minorStars);
  for (const palace of chart.palaces) addBrightness(brightnessCounts, allStars(palace));

  return {
    solarDate: chart.solarDate,
    brightnessCounts,
    majorStars: tallyByClass(majorStars, AUSPICIOUS_MAJOR, INAUSPICIOUS_MAJOR),
    minorStars: tallyByClass(minorStars, AUSPICIOUS_MINOR, INAUSPICIOUS_MINOR),
    emptyPalaces: emptyPalaces(chart),
    palaceSummaries: palaceSummaries(chart),
    disclaimer: DISCLAIMER,
  };
}

/** Render structural analysis as text, Markdown, pretty JSON, or self-contained HTML. */
export function formatAnalysis(
  analysis: ChartAnalysis,
  opts: AnalysisFormatOptions = {},
): string {
  switch (opts.format ?? 'text') {
    case 'json':
      return JSON.stringify(analysis, null, 2);
    case 'markdown':
      return toMarkdown(analysis);
    case 'html':
      return toHtml(analysis);
    case 'text':
    default:
      return toText(analysis);
  }
}
