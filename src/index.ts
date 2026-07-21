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
  toCsv,
} from './batch.js';
export type { BatchEntry, BatchResult, BatchOk, BatchErr } from './batch.js';
export { compareCharts, formatComparison } from './compare.js';
export type { Comparison, ComparisonFormat, SharedPosition } from './compare.js';
export { calculateHoroscope, formatHoroscope } from './horoscope.js';
export type { HoroscopeFormat, HoroscopeFormatOptions } from './horoscope.js';
export { compareCohort, formatCohort } from './cohort.js';
export type {
  CohortComparison,
  CohortFormat,
  CohortFormatOptions,
  CohortMatrixCell,
  CohortPair,
} from './cohort.js';
export { analyzeChart, formatAnalysis } from './analyze.js';
export type {
  AnalysisFormat,
  AnalysisFormatOptions,
  ChartAnalysis,
  EmptyPalace,
  PalaceStarSummary,
  StarClassTally,
} from './analyze.js';
export { analyzeMutagens, formatMutagens } from './mutagen.js';
export type {
  MutagenEntry,
  MutagenFormat,
  MutagenFormatOptions,
  MutagenKind,
  MutagenReport,
} from './mutagen.js';
export { analyzeElements, formatElements } from './elements.js';
export type {
  BranchTally,
  ElementKey,
  ElementsFormat,
  ElementsFormatOptions,
  ElementsReport,
} from './elements.js';
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
  Horoscope,
  HoroscopePalace,
  HoroscopeTransformation,
  Lang,
  Palace,
  Star,
} from './types.js';
