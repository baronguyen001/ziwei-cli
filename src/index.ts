/**
 * ziwei-cli — Zi Wei Dou Shu (紫微斗数 / Tử Vi Đẩu Số) natal chart toolkit.
 *
 * @example
 * ```ts
 * import { calculateChart, formatChart } from 'ziwei-cli';
 *
 * const chart = calculateChart({ date: '1990-05-20', hourIndex: 6, gender: 'male' });
 * console.log(formatChart(chart, { format: 'json' }));
 * ```
 *
 * @packageDocumentation
 */

export { calculateChart, InvalidBirthInputError } from './chart.js';
export { formatChart } from './format.js';
export type { ChartFormat, FormatOptions } from './format.js';
export {
  parseBatchCsv,
  parseBatchJson,
  calculateBatch,
  toJsonl,
} from './batch.js';
export type { BatchEntry, BatchResult, BatchOk, BatchErr } from './batch.js';
export { compareCharts, formatComparison } from './compare.js';
export type { Comparison, ComparisonFormat, SharedPosition } from './compare.js';
export { interpretChart, SECTIONS } from './ai.js';
export type {
  ChatClient,
  InterpretOptions,
  SectionKey,
  SectionResult,
} from './ai.js';
export { BIRTH_HOURS } from './types.js';
export type {
  BirthInput,
  Chart,
  Decadal,
  Gender,
  Lang,
  Palace,
  Star,
} from './types.js';
