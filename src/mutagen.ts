import type { Chart, Lang, Palace, Star } from './types.js';

export type MutagenKind = 'loc' | 'quyen' | 'khoa' | 'ky';
export type MutagenFormat = 'text' | 'markdown' | 'json' | 'html';

export interface MutagenFormatOptions {
  format?: MutagenFormat;
  lang?: Lang;
}

export interface MutagenEntry {
  kind: MutagenKind;
  label: string;
  star: string;
  palace: {
    index: number;
    name: string;
  };
  isLifeAxis: boolean;
}

export interface MutagenReport {
  solarDate: string;
  counts: Record<MutagenKind, number>;
  transformations: Record<MutagenKind, MutagenEntry[]>;
  absent: MutagenKind[];
  kyOnLifeAxis: boolean;
  disclaimer: string;
}

const DISCLAIMER = 'Structural digest only; this is not advice.';
const KINDS: MutagenKind[] = ['loc', 'quyen', 'khoa', 'ky'];
const LABELS: Record<MutagenKind, string> = {
  loc: 'Loc',
  quyen: 'Quyen',
  khoa: 'Khoa',
  ky: 'Ky',
};

function plain(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

function normalizeMutagen(value: string | undefined): MutagenKind | null {
  const raw = (value ?? '').trim();
  if (raw === '禄') return 'loc';
  if (raw === '权') return 'quyen';
  if (raw === '科') return 'khoa';
  if (raw === '忌') return 'ky';
  const key = plain(raw);
  if (key === 'a' || key === 'loc' || key === 'luc' || key === 'lu') return 'loc';
  if (key === 'b' || key === 'quyen' || key === 'quan') return 'quyen';
  if (key === 'c' || key === 'khoa') return 'khoa';
  if (key === 'd' || key === 'ky' || key === 'ki' || key === 'ke') return 'ky';
  return null;
}

function normalizePalaceName(name: string): string {
  return plain(name).replace(/\s+/g, '');
}

function isLifeAxisPalace(palace: Palace): boolean {
  const name = normalizePalaceName(palace.name);
  return new Set([
    'menh',
    'menhcung',
    'soul',
    '命宫',
    '命宮',
    'taibach',
    'wealth',
    '财帛',
    '財帛',
    'quanloc',
    'career',
    '官禄',
    '官祿',
    'thiendi',
    'surface',
    '迁移',
    '遷移',
  ]).has(name);
}

function allStars(palace: Palace): Star[] {
  return [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars];
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function emptyTransformations(): Record<MutagenKind, MutagenEntry[]> {
  return {
    loc: [],
    quyen: [],
    khoa: [],
    ky: [],
  };
}

function entryLine(entry: MutagenEntry): string {
  const lifeAxis = entry.kind === 'ky' ? `, life-axis: ${entry.isLifeAxis ? 'yes' : 'no'}` : '';
  return `${entry.star} in ${entry.palace.name} (#${entry.palace.index})${lifeAxis}`;
}

function toText(report: MutagenReport): string {
  const out: string[] = ['=== FOUR-TRANSFORMATIONS MAP ===', ''];
  out.push(`Solar date: ${report.solarDate}`);
  out.push(DISCLAIMER);
  out.push('');
  for (const kind of KINDS) {
    const entries = report.transformations[kind];
    out.push(`${LABELS[kind]} (${report.counts[kind]}):`);
    if (entries.length === 0) {
      out.push('  absent from this chart');
    } else {
      for (const entry of entries) out.push(`  ${entryLine(entry)}`);
    }
  }
  out.push('');
  out.push(`Ky on life-axis palace: ${report.kyOnLifeAxis ? 'yes' : 'no'}`);
  return out.join('\n');
}

function toMarkdown(report: MutagenReport): string {
  const out: string[] = [
    '# Four-transformations map',
    '',
    `Solar date: ${report.solarDate}`,
    '',
    `> ${DISCLAIMER}`,
    '',
    '| Transformation | Count | Placement |',
    '|---|---:|---|',
  ];
  for (const kind of KINDS) {
    const entries = report.transformations[kind];
    const placement =
      entries.length === 0
        ? 'absent from this chart'
        : entries.map((entry) => entryLine(entry)).join('<br>');
    out.push(`| ${LABELS[kind]} | ${report.counts[kind]} | ${placement} |`);
  }
  out.push('');
  out.push(`Ky on life-axis palace: **${report.kyOnLifeAxis ? 'yes' : 'no'}**`);
  return out.join('\n');
}

function toHtml(report: MutagenReport): string {
  const rows = KINDS.map((kind) => {
    const entries = report.transformations[kind];
    const placement =
      entries.length === 0
        ? 'absent from this chart'
        : entries.map((entry) => esc(entryLine(entry))).join('<br>');
    return `<tr><td>${LABELS[kind]}</td><td>${report.counts[kind]}</td><td>${placement}</td></tr>`;
  }).join('');
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Zi Wei Four-Transformations - ${esc(report.solarDate)}</title>
<style>
:root{--bg:#111318;--panel:#1d222b;--ink:#edf0f5;--mut:#a8b0bd;--line:#303846;--acc:#e0a65a}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:24px}
h1{font-size:22px;margin:0 0 4px}
.sub,footer{color:var(--mut)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin:18px 0}
.stat{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:13px}
.label{color:var(--mut);font-size:12px;text-transform:uppercase}
.value{font-weight:700;margin-top:2px}
table{width:100%;border-collapse:collapse;background:var(--panel);border:1px solid var(--line);border-radius:8px;overflow:hidden}
th,td{text-align:left;padding:9px;border-bottom:1px solid var(--line);vertical-align:top}
th:nth-child(2),td:nth-child(2){text-align:right}
th{color:var(--mut);font-size:12px;text-transform:uppercase}
tr:last-child td{border-bottom:0}
footer{font-size:12px;margin-top:20px}
</style>
</head>
<body>
<h1>Zi Wei Four-Transformations</h1>
<p class="sub">${esc(report.solarDate)} · ${esc(DISCLAIMER)}</p>
<section class="stats">
<div class="stat"><div class="label">Present markers</div><div class="value">${KINDS.length - report.absent.length}/4</div></div>
<div class="stat"><div class="label">Ky life-axis</div><div class="value">${report.kyOnLifeAxis ? 'yes' : 'no'}</div></div>
</section>
<table><thead><tr><th>Transformation</th><th>Count</th><th>Placement</th></tr></thead><tbody>${rows}</tbody></table>
<footer>Generated by ziwei-cli - deterministic, offline, no key.</footer>
</body>
</html>`;
}

/** Build a deterministic Tu Hoa / four-transformations placement map for a chart. */
export function analyzeMutagens(chart: Chart): MutagenReport {
  const transformations = emptyTransformations();
  for (let index = 0; index < chart.palaces.length; index += 1) {
    const palace = chart.palaces[index]!;
    for (const star of allStars(palace)) {
      const kind = normalizeMutagen(star.mutagen);
      if (!kind) continue;
      transformations[kind].push({
        kind,
        label: LABELS[kind],
        star: star.name,
        palace: { index, name: palace.name },
        isLifeAxis: isLifeAxisPalace(palace),
      });
    }
  }
  const counts = {
    loc: transformations.loc.length,
    quyen: transformations.quyen.length,
    khoa: transformations.khoa.length,
    ky: transformations.ky.length,
  };
  return {
    solarDate: chart.solarDate,
    counts,
    transformations,
    absent: KINDS.filter((kind) => counts[kind] === 0),
    kyOnLifeAxis: transformations.ky.some((entry) => entry.isLifeAxis),
    disclaimer: DISCLAIMER,
  };
}

/** Render the four-transformations map as text, Markdown, pretty JSON, or HTML. */
export function formatMutagens(
  report: MutagenReport,
  opts: MutagenFormatOptions = {},
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
