import type { Chart, Lang, Palace } from './types.js';

export type ElementKey = 'kim' | 'moc' | 'thuy' | 'hoa' | 'tho';
export type ElementsFormat = 'text' | 'markdown' | 'json' | 'html';

export interface ElementsFormatOptions {
  format?: ElementsFormat;
  lang?: Lang;
}

export interface BranchTally {
  branch: string;
  element: ElementKey | 'unknown';
  palaces: number;
  starWeight: number;
}

export interface ElementsReport {
  solarDate: string;
  fiveElementsClass: string;
  counts: Record<ElementKey, number>;
  unknown: number;
  rawBranchTally: BranchTally[];
  dominant: ElementKey[];
  deficient: ElementKey[];
  balanceScore: number;
  formula: string;
  disclaimer: string;
}

const DISCLAIMER = 'Structural digest only; this is not advice.';
const FORMULA =
  'balanceScore = round(100 * (1 - sum(abs(weightedCount - total/5)) / (1.6 * total))); total 0 returns 100.';
const ELEMENTS: ElementKey[] = ['kim', 'moc', 'thuy', 'hoa', 'tho'];
const LABELS: Record<ElementKey | 'unknown', string> = {
  kim: 'Kim / Metal',
  moc: 'Moc / Wood',
  thuy: 'Thuy / Water',
  hoa: 'Hoa / Fire',
  tho: 'Tho / Earth',
  unknown: 'Unknown',
};

function plain(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

function normalizeBranch(branch: string): string {
  return plain(branch).replace(/\s+/g, '');
}

function branchElement(branch: string): ElementKey | 'unknown' {
  const key = normalizeBranch(branch);
  if (new Set(['dan', 'mao', 'yin', '寅', '卯']).has(key)) return 'moc';
  if (new Set(['ty', 'ti', 'ngo', 'si', 'woo', '巳', '午']).has(key)) return 'hoa';
  if (new Set(['than', 'dau', 'shen', 'you', '申', '酉']).has(key)) return 'kim';
  if (new Set(['hoi', 'hai', 'te', 'zi', '亥', '子']).has(key)) return 'thuy';
  if (new Set(['thin', 'tuat', 'suu', 'mui', 'chen', 'xu', 'chou', 'wei', '辰', '戌', '丑', '未']).has(key)) {
    return 'tho';
  }
  return 'unknown';
}

function starWeight(palace: Palace): number {
  return palace.majorStars.length + palace.minorStars.length + palace.adjectiveStars.length;
}

function emptyCounts(): Record<ElementKey, number> {
  return { kim: 0, moc: 0, thuy: 0, hoa: 0, tho: 0 };
}

function minKeys(counts: Record<ElementKey, number>): ElementKey[] {
  const min = Math.min(...ELEMENTS.map((element) => counts[element]));
  return ELEMENTS.filter((element) => counts[element] === min);
}

function maxKeys(counts: Record<ElementKey, number>): ElementKey[] {
  const max = Math.max(...ELEMENTS.map((element) => counts[element]));
  return ELEMENTS.filter((element) => counts[element] === max);
}

/**
 * Score five-element balance from weighted palace branch distribution.
 *
 * The weighted count for each palace is its total star count. The score is
 * `round(100 * (1 - sum(abs(weightedCount - total/5)) / (1.6 * total)))`.
 * The denominator is the maximum possible five-way distance, when all weight
 * sits in one element. A zero-total chart returns 100.
 */
function balanceScore(counts: Record<ElementKey, number>): number {
  const total = ELEMENTS.reduce((sum, element) => sum + counts[element], 0);
  if (total === 0) return 100;
  const target = total / ELEMENTS.length;
  const distance = ELEMENTS.reduce((sum, element) => sum + Math.abs(counts[element] - target), 0);
  return Math.max(0, Math.min(100, Math.round(100 * (1 - distance / (1.6 * total)))));
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function toText(report: ElementsReport): string {
  const out: string[] = ['=== FIVE-ELEMENT BRANCH BALANCE ===', ''];
  out.push(`Solar date: ${report.solarDate}`);
  out.push(`Five-elements class: ${report.fiveElementsClass}`);
  out.push(DISCLAIMER);
  out.push('');
  out.push(`Weighted counts: ${ELEMENTS.map((e) => `${e} ${report.counts[e]}`).join(', ')}, unknown ${report.unknown}`);
  out.push(`Dominant: ${report.dominant.join(', ')}`);
  out.push(`Deficient: ${report.deficient.join(', ')}`);
  out.push(`Balance score: ${report.balanceScore}/100`);
  out.push('');
  out.push('Raw per-branch tally:');
  for (const row of report.rawBranchTally) {
    out.push(`  ${row.branch}: ${row.palaces} palace(s), ${row.starWeight} star weight, ${row.element}`);
  }
  return out.join('\n');
}

function toMarkdown(report: ElementsReport): string {
  const out: string[] = [
    '# Five-element branch balance',
    '',
    `Solar date: ${report.solarDate}`,
    '',
    `Five-elements class: **${report.fiveElementsClass}**`,
    '',
    `> ${DISCLAIMER}`,
    '',
    `Balance score: **${report.balanceScore}/100**`,
    '',
    `Dominant: **${report.dominant.join(', ')}**`,
    '',
    `Deficient: **${report.deficient.join(', ')}**`,
    '',
    '| Element | Weighted count |',
    '|---|---:|',
  ];
  for (const element of ELEMENTS) out.push(`| ${LABELS[element]} | ${report.counts[element]} |`);
  out.push(`| ${LABELS.unknown} | ${report.unknown} |`);
  out.push('', '## Raw per-branch tally', '| Branch | Element | Palaces | Star weight |', '|---|---|---:|---:|');
  for (const row of report.rawBranchTally) {
    out.push(`| ${row.branch} | ${row.element} | ${row.palaces} | ${row.starWeight} |`);
  }
  return out.join('\n');
}

function toHtml(report: ElementsReport): string {
  const countRows = [
    ...ELEMENTS.map(
      (element) => `<tr><td>${LABELS[element]}</td><td>${report.counts[element]}</td></tr>`,
    ),
    `<tr><td>${LABELS.unknown}</td><td>${report.unknown}</td></tr>`,
  ].join('');
  const branchRows = report.rawBranchTally
    .map(
      (row) =>
        `<tr><td>${esc(row.branch)}</td><td>${row.element}</td><td>${row.palaces}</td><td>${row.starWeight}</td></tr>`,
    )
    .join('');
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Zi Wei Five-Element Balance - ${esc(report.solarDate)}</title>
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
th:first-child,td:first-child,th:nth-child(2),td:nth-child(2){text-align:left}
th{color:var(--mut);font-size:12px;text-transform:uppercase}
tr:last-child td{border-bottom:0}
footer{font-size:12px;margin-top:20px}
</style>
</head>
<body>
<h1>Zi Wei Five-Element Balance</h1>
<p class="sub">${esc(report.solarDate)} · ${esc(DISCLAIMER)}</p>
<section class="stats">
<div class="stat"><div class="label">Five-elements class</div><div class="value">${esc(report.fiveElementsClass)}</div></div>
<div class="stat"><div class="label">Balance score</div><div class="value">${report.balanceScore}/100</div></div>
<div class="stat"><div class="label">Dominant</div><div class="value">${report.dominant.join(', ')}</div></div>
<div class="stat"><div class="label">Deficient</div><div class="value">${report.deficient.join(', ')}</div></div>
</section>
<h2>Weighted counts</h2>
<table><thead><tr><th>Element</th><th>Weighted count</th></tr></thead><tbody>${countRows}</tbody></table>
<h2>Raw per-branch tally</h2>
<table><thead><tr><th>Branch</th><th>Element</th><th>Palaces</th><th>Star weight</th></tr></thead><tbody>${branchRows}</tbody></table>
<footer>Generated by ziwei-cli - deterministic, offline, no key.</footer>
</body>
</html>`;
}

/** Build a deterministic five-element branch-balance report for a chart. */
export function analyzeElements(chart: Chart): ElementsReport {
  const counts = emptyCounts();
  const byBranch = new Map<string, BranchTally>();
  let unknown = 0;

  for (const palace of chart.palaces) {
    const branch = palace.earthlyBranch || 'unknown';
    const element = branchElement(branch);
    const weight = starWeight(palace);
    const tally = byBranch.get(branch) ?? { branch, element, palaces: 0, starWeight: 0 };
    tally.palaces += 1;
    tally.starWeight += weight;
    byBranch.set(branch, tally);
    if (element === 'unknown') unknown += weight;
    else counts[element] += weight;
  }

  return {
    solarDate: chart.solarDate,
    fiveElementsClass: chart.fiveElementsClass,
    counts,
    unknown,
    rawBranchTally: [...byBranch.values()],
    dominant: maxKeys(counts),
    deficient: minKeys(counts),
    balanceScore: balanceScore(counts),
    formula: FORMULA,
    disclaimer: DISCLAIMER,
  };
}

/** Render five-element balance as text, Markdown, pretty JSON, or HTML. */
export function formatElements(
  report: ElementsReport,
  opts: ElementsFormatOptions = {},
): string {
  switch (opts.format ?? 'text') {
    case 'json':
      return JSON.stringify(report, null, 2);
    case 'markdown':
      return toMarkdown(report);
    case 'html':
      return toHtml(report);
    case 'text':
    default:
      return toText(report);
  }
}
