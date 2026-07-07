import { compareCharts, type Comparison } from './compare.js';
import type { Chart, Lang } from './types.js';

/** Rendering format for {@link formatCohort}. */
export type CohortFormat = 'text' | 'markdown' | 'json' | 'html';

export interface CohortFormatOptions {
  format?: CohortFormat;
  lang?: Lang;
}

export interface CohortMatrixCell {
  row: number;
  column: number;
  affinity: number;
  comparison: Comparison | null;
}

export interface CohortPair {
  a: number;
  b: number;
  affinity: number;
  comparison: Comparison;
}

export interface CohortComparison {
  size: number;
  matrix: CohortMatrixCell[][];
  rankedPairs: CohortPair[];
}

function selfComparison(): CohortMatrixCell {
  return {
    row: -1,
    column: -1,
    affinity: 100,
    comparison: null,
  };
}

function labelAt(labels: string[], index: number): string {
  return labels[index] ?? `chart ${index + 1}`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Compare every chart against every other chart using {@link compareCharts}.
 * The diagonal is a self-score of 100 and stores no duplicate comparison.
 */
export function compareCohort(charts: Chart[]): CohortComparison {
  const matrix: CohortMatrixCell[][] = charts.map((_, row) =>
    charts.map((__, column) => ({ ...selfComparison(), row, column })),
  );
  const rankedPairs: CohortPair[] = [];

  for (let i = 0; i < charts.length; i += 1) {
    for (let j = i + 1; j < charts.length; j += 1) {
      const comparison = compareCharts(charts[i]!, charts[j]!);
      const cell = { row: i, column: j, affinity: comparison.affinity, comparison };
      const mirror = { row: j, column: i, affinity: comparison.affinity, comparison };
      matrix[i]![j] = cell;
      matrix[j]![i] = mirror;
      rankedPairs.push({ a: i, b: j, affinity: comparison.affinity, comparison });
    }
  }

  rankedPairs.sort((x, y) => y.affinity - x.affinity || x.a - y.a || x.b - y.b);
  return { size: charts.length, matrix, rankedPairs };
}

function toText(result: CohortComparison, labels: string[]): string {
  const out: string[] = ['=== COHORT AFFINITY ===', ''];
  out.push(`Charts: ${result.size}`);
  out.push('');
  out.push('Affinity matrix:');
  out.push(['', ...labels.map((label) => label.slice(0, 12))].join('\t'));
  for (let i = 0; i < result.size; i += 1) {
    out.push(
      [
        labelAt(labels, i).slice(0, 12),
        ...result.matrix[i]!.map((cell) => String(cell.affinity)),
      ].join('\t'),
    );
  }
  out.push('');
  out.push('Best matching pairs:');
  if (result.rankedPairs.length === 0) {
    out.push('  none');
  } else {
    for (const pair of result.rankedPairs) {
      out.push(
        `  ${labelAt(labels, pair.a)} + ${labelAt(labels, pair.b)}: ${pair.affinity}/100`,
      );
    }
  }
  out.push('');
  out.push('Note: affinity is a deterministic structural heuristic, not advice.');
  return out.join('\n');
}

function toMarkdown(result: CohortComparison, labels: string[]): string {
  const out: string[] = ['# Cohort affinity', '', `Charts: ${result.size}`, ''];
  out.push('## Matrix');
  out.push(['| |', ...labels.map((label) => `${label} |`)].join(' '));
  out.push(['|---|', ...labels.map(() => '---:|')].join(' '));
  for (let i = 0; i < result.size; i += 1) {
    out.push(
      [`| ${labelAt(labels, i)} |`, ...result.matrix[i]!.map((c) => `${c.affinity} |`)].join(
        ' ',
      ),
    );
  }
  out.push('');
  out.push('## Best matching pairs');
  if (result.rankedPairs.length === 0) out.push('- none');
  for (const pair of result.rankedPairs) {
    out.push(`- ${labelAt(labels, pair.a)} + ${labelAt(labels, pair.b)}: ${pair.affinity}/100`);
  }
  out.push('');
  out.push('> Affinity is a deterministic structural heuristic, not advice.');
  return out.join('\n');
}

function toHtml(result: CohortComparison, labels: string[]): string {
  const header = labels.map((label) => `<th>${esc(label)}</th>`).join('');
  const rows = result.matrix
    .map((row, i) => {
      const cells = row.map((cell) => `<td>${cell.affinity}</td>`).join('');
      return `<tr><th>${esc(labelAt(labels, i))}</th>${cells}</tr>`;
    })
    .join('');
  const pairs =
    result.rankedPairs.length === 0
      ? '<li>none</li>'
      : result.rankedPairs
          .map(
            (pair) =>
              `<li><strong>${esc(labelAt(labels, pair.a))}</strong> + <strong>${esc(
                labelAt(labels, pair.b),
              )}</strong>: ${pair.affinity}/100</li>`,
          )
          .join('');
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Zi Wei Cohort Affinity</title>
<style>
:root{--bg:#111417;--panel:#1d2228;--ink:#edf0f3;--mut:#a6afb8;--line:#313941;--acc:#67b7a4}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:24px}
h1{font-size:22px;margin:0 0 4px}
h2{font-size:16px;margin:22px 0 8px}
.sub,footer{color:var(--mut)}
table{width:100%;border-collapse:collapse;background:var(--panel);border:1px solid var(--line);border-radius:8px;overflow:hidden}
th,td{text-align:right;padding:9px;border-bottom:1px solid var(--line);border-right:1px solid var(--line)}
th:first-child{text-align:left}
td:last-child,th:last-child{border-right:0}
tr:last-child td,tr:last-child th{border-bottom:0}
thead th{color:var(--mut);font-size:12px}
td{font-weight:700}
li{margin:4px 0}
strong{color:var(--acc)}
footer{font-size:12px;margin-top:20px}
</style>
</head>
<body>
<h1>Zi Wei Cohort Affinity</h1>
<p class="sub">${result.size} charts · deterministic, offline, no key</p>
<table><thead><tr><th></th>${header}</tr></thead><tbody>${rows}</tbody></table>
<h2>Best matching pairs</h2>
<ol>${pairs}</ol>
<footer>Affinity is a deterministic structural heuristic, not advice.</footer>
</body>
</html>`;
}

/** Render cohort affinity as text, Markdown, pretty JSON, or self-contained HTML. */
export function formatCohort(
  result: CohortComparison,
  labels: string[],
  opts: CohortFormatOptions = {},
): string {
  switch (opts.format ?? 'text') {
    case 'json':
      return JSON.stringify({ labels, ...result }, null, 2);
    case 'markdown':
      return toMarkdown(result, labels);
    case 'html':
      return toHtml(result, labels);
    case 'text':
    default:
      return toText(result, labels);
  }
}
