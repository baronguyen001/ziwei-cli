/**
 * Deterministic comparison ("synastry") of two Zi Wei Dou Shu charts. Everything
 * here is pure structural arithmetic on the computed charts — no model, no
 * randomness, no network — so the same two charts always produce the same
 * result. The affinity score is an **illustrative** heuristic, not a prediction.
 */

import type { Chart } from './types.js';

export interface SharedPosition {
  /** Earthly branch (địa chi) shared by both charts at this position. */
  branch: string;
  /** Major stars that sit on that branch in both charts. */
  stars: string[];
}

export interface Comparison {
  soulA: string;
  soulB: string;
  sameSoul: boolean;
  bodyA: string;
  bodyB: string;
  sameBody: boolean;
  fiveElementsA: string;
  fiveElementsB: string;
  sameFiveElements: boolean;
  /** Major stars present in both charts (anywhere). */
  commonMajorStars: string[];
  /** Branches where both charts place at least one of the same major star. */
  sharedPositions: SharedPosition[];
  /** 0–100 heuristic affinity. Deterministic and illustrative — NOT advice. */
  affinity: number;
}

function majorStarNames(chart: Chart): Set<string> {
  const out = new Set<string>();
  for (const p of chart.palaces) {
    for (const s of p.majorStars) out.add(s.name);
  }
  return out;
}

function majorByBranch(chart: Chart): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const p of chart.palaces) {
    const set = map.get(p.earthlyBranch) ?? new Set<string>();
    for (const s of p.majorStars) set.add(s.name);
    map.set(p.earthlyBranch, set);
  }
  return map;
}

function intersectSorted(a: Set<string>, b: Set<string>): string[] {
  const out: string[] = [];
  for (const v of a) if (b.has(v)) out.push(v);
  return out.sort();
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Compare two computed charts. Order-independent for the symmetric fields. */
export function compareCharts(a: Chart, b: Chart): Comparison {
  const commonMajorStars = intersectSorted(majorStarNames(a), majorStarNames(b));

  const branchesA = majorByBranch(a);
  const branchesB = majorByBranch(b);
  const sharedPositions: SharedPosition[] = [];
  for (const [branch, starsA] of branchesA) {
    const starsB = branchesB.get(branch);
    if (!starsB) continue;
    const stars = intersectSorted(starsA, starsB);
    if (stars.length > 0) sharedPositions.push({ branch, stars });
  }
  sharedPositions.sort((x, y) => x.branch.localeCompare(y.branch));

  const sameSoul = a.soul === b.soul && a.soul !== '';
  const sameBody = a.body === b.body && a.body !== '';
  const sameFiveElements =
    a.fiveElementsClass === b.fiveElementsClass && a.fiveElementsClass !== '';

  const affinity = clamp(
    Math.round(
      (sameSoul ? 20 : 0) +
        (sameBody ? 10 : 0) +
        (sameFiveElements ? 10 : 0) +
        Math.min(40, commonMajorStars.length * 4) +
        Math.min(20, sharedPositions.length * 5),
    ),
    0,
    100,
  );

  return {
    soulA: a.soul,
    soulB: b.soul,
    sameSoul,
    bodyA: a.body,
    bodyB: b.body,
    sameBody,
    fiveElementsA: a.fiveElementsClass,
    fiveElementsB: b.fiveElementsClass,
    sameFiveElements,
    commonMajorStars,
    sharedPositions,
    affinity,
  };
}

/** Rendering format for {@link formatComparison}. */
export type ComparisonFormat = 'text' | 'markdown' | 'json';

function yesNo(b: boolean): string {
  return b ? 'yes' : 'no';
}

/** Render a comparison as text, Markdown, or pretty JSON (`text` by default). */
export function formatComparison(
  cmp: Comparison,
  opts: { format?: ComparisonFormat } = {},
): string {
  if ((opts.format ?? 'text') === 'json') return JSON.stringify(cmp, null, 2);

  const md = opts.format === 'markdown';
  const h1 = md ? '# Chart comparison' : '=== CHART COMPARISON (Synastry) ===';
  const bullet = md ? '- ' : '  ';
  const lines: string[] = [h1, ''];
  lines.push(`${bullet}Affinity (illustrative): ${cmp.affinity}/100`);
  lines.push(`${bullet}Soul: ${cmp.soulA} vs ${cmp.soulB} — match: ${yesNo(cmp.sameSoul)}`);
  lines.push(`${bullet}Body: ${cmp.bodyA} vs ${cmp.bodyB} — match: ${yesNo(cmp.sameBody)}`);
  lines.push(
    `${bullet}Five-Elements: ${cmp.fiveElementsA} vs ${cmp.fiveElementsB} — match: ${yesNo(
      cmp.sameFiveElements,
    )}`,
  );
  lines.push(
    `${bullet}Common major stars (${cmp.commonMajorStars.length}): ${
      cmp.commonMajorStars.join(', ') || '—'
    }`,
  );
  lines.push(`${bullet}Shared positions (${cmp.sharedPositions.length}):`);
  if (cmp.sharedPositions.length === 0) {
    lines.push(`${bullet}  —`);
  } else {
    for (const sp of cmp.sharedPositions) {
      lines.push(`${bullet}  ${sp.branch}: ${sp.stars.join(', ')}`);
    }
  }
  lines.push('');
  lines.push(
    md
      ? '> Affinity is a deterministic structural heuristic, not a prediction or relationship advice.'
      : 'Note: affinity is a deterministic structural heuristic, not advice.',
  );
  return lines.join('\n');
}
