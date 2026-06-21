/**
 * Batch chart computation: turn a list of births (from a CSV or JSON file) into
 * many charts in one pass. Every row is computed independently — a single bad
 * row is captured as an error result rather than aborting the whole batch — so
 * the output lines up one-to-one with the input and is safe to stream as JSONL.
 */

import { calculateChart, InvalidBirthInputError } from './chart.js';
import type { BirthInput, Chart, Gender, Lang } from './types.js';

/** One requested birth, with an optional caller-supplied label. */
export interface BatchEntry {
  /** A name/id echoed back on the result so rows can be matched up. */
  label?: string;
  input: BirthInput;
}

/** A successfully computed row. */
export interface BatchOk {
  ok: true;
  label?: string;
  input: BirthInput;
  chart: Chart;
}

/** A row that failed validation or computation. */
export interface BatchErr {
  ok: false;
  label?: string;
  input: Record<string, unknown>;
  error: string;
}

export type BatchResult = BatchOk | BatchErr;

const GENDERS = new Set<Gender>(['male', 'female']);
const LANGS = new Set<Lang>(['vi-VN', 'en-US', 'zh-CN']);

/** Normalise a short `vi`/`en` (or full `vi-VN`) language token to a {@link Lang}. */
function coerceLang(v: string | undefined): Lang | undefined {
  if (v === undefined || v === '') return undefined;
  if (v === 'vi') return 'vi-VN';
  if (v === 'en') return 'en-US';
  if (v === 'zh') return 'zh-CN';
  if (LANGS.has(v as Lang)) return v as Lang;
  throw new InvalidBirthInputError(`lang must be vi|en|zh, got "${v}"`);
}

function rowToEntry(
  date: string,
  hour: string,
  gender: string,
  lang?: string,
  label?: string,
): BatchEntry {
  const hourIndex = Number(hour);
  if (!Number.isInteger(hourIndex)) {
    throw new InvalidBirthInputError(`hour must be an integer 0..11, got "${hour}"`);
  }
  if (!GENDERS.has(gender as Gender)) {
    throw new InvalidBirthInputError(`gender must be male|female, got "${gender}"`);
  }
  const input: BirthInput = { date, hourIndex, gender: gender as Gender };
  const resolved = coerceLang(lang);
  if (resolved) input.lang = resolved;
  return label ? { label, input } : { input };
}

/**
 * Parse a simple CSV of births. Columns are `date,hour,gender[,lang][,label]`.
 * Blank lines and `#` comments are ignored, and an optional header row (any
 * first row containing the word `date`) is skipped.
 */
export function parseBatchCsv(text: string): BatchEntry[] {
  const rows = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));
  if (rows.length === 0) return [];
  if (/(^|,)\s*date\s*(,|$)/i.test(rows[0]!)) rows.shift();
  return rows.map((line, i) => {
    const cells = line.split(',').map((c) => c.trim());
    if (cells.length < 3) {
      throw new InvalidBirthInputError(
        `row ${i + 1}: expected at least date,hour,gender — got "${line}"`,
      );
    }
    return rowToEntry(cells[0]!, cells[1]!, cells[2]!, cells[3], cells[4]);
  });
}

interface RawJsonEntry {
  label?: unknown;
  date?: unknown;
  hour?: unknown;
  hourIndex?: unknown;
  gender?: unknown;
  lang?: unknown;
}

/**
 * Parse a JSON array of births. Each item accepts `{ date, hour|hourIndex,
 * gender, lang?, label? }`.
 */
export function parseBatchJson(text: string): BatchEntry[] {
  const data: unknown = JSON.parse(text);
  if (!Array.isArray(data)) {
    throw new InvalidBirthInputError('JSON batch input must be an array of births');
  }
  return data.map((item, i) => {
    if (typeof item !== 'object' || item === null) {
      throw new InvalidBirthInputError(`item ${i + 1} is not an object`);
    }
    const o = item as RawJsonEntry;
    const hour = o.hour ?? o.hourIndex;
    return rowToEntry(
      String(o.date ?? ''),
      String(hour ?? ''),
      String(o.gender ?? ''),
      o.lang === undefined ? undefined : String(o.lang),
      o.label === undefined ? undefined : String(o.label),
    );
  });
}

/**
 * Compute charts for every entry. Failures are captured per row (never thrown),
 * so the result array is exactly as long as `entries`.
 */
export function calculateBatch(entries: BatchEntry[]): BatchResult[] {
  return entries.map((entry) => {
    try {
      const chart = calculateChart(entry.input);
      const ok: BatchOk = { ok: true, input: entry.input, chart };
      if (entry.label !== undefined) ok.label = entry.label;
      return ok;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const out: BatchErr = {
        ok: false,
        input: { ...entry.input },
        error: message,
      };
      if (entry.label !== undefined) out.label = entry.label;
      return out;
    }
  });
}

/** Serialise batch results as JSON Lines (one compact JSON object per line). */
export function toJsonl(results: BatchResult[]): string {
  return results.map((r) => JSON.stringify(r)).join('\n');
}
