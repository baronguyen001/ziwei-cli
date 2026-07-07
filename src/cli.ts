#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { calculateChart, InvalidBirthInputError } from './chart.js';
import { formatChart, type ChartFormat } from './format.js';
import { interpretChart, type ChatClient, type SectionKey } from './ai.js';
import {
  parseBatchCsv,
  parseBatchJson,
  calculateBatch,
  toJsonl,
} from './batch.js';
import { compareCharts, formatComparison, type ComparisonFormat } from './compare.js';
import { calculateHoroscope, formatHoroscope } from './horoscope.js';
import { compareCohort, formatCohort } from './cohort.js';
import { analyzeChart, formatAnalysis } from './analyze.js';
import { BIRTH_HOURS, type Gender, type Lang } from './types.js';

const VERSION = '0.3.0';

export interface CliIO {
  log: (msg: string) => void;
  error: (msg: string) => void;
}

const DEFAULT_IO: CliIO = {
  log: (m) => console.log(m),
  error: (m) => console.error(m),
};

const HELP = `ziwei - Zi Wei Dou Shu natal chart CLI

Usage:
  ziwei chart      --date <YYYY-MM-DD> --hour <0-11> --gender <male|female> [options]
  ziwei analyze    --date <YYYY-MM-DD> --hour <0-11> --gender <male|female> [options]
  ziwei horoscope  --date <YYYY-MM-DD> --hour <0-11> --gender <male|female> [options]
  ziwei read       --date <YYYY-MM-DD> --hour <0-11> --gender <male|female> [options]
  ziwei batch      --input <births.csv|.json> [--format jsonl|json]
  ziwei compare    --date1 .. --hour1 .. --gender1 .. --date2 .. --hour2 .. --gender2 .. [options]
  ziwei cohort     --input <births.csv|.json> [options]
  ziwei hours
  ziwei --help | --version

chart/analyze/horoscope options:
  --format <text|markdown|json|html>   output format (default: text)
  --lang   <vi|en|zh>                  name language (default: vi)
  --target <YYYY|YYYY-MM-DD>           target date for horoscope (default: birth date)

batch options (deterministic, offline - no key needed):
  --input  <file>   .csv (date,hour,gender[,lang][,label]) or .json (array of births)
  --format <jsonl|json>                output format (default: jsonl)

compare options (deterministic synastry of two charts, offline):
  --format <text|markdown|json>        output format (default: text)
  --lang   <vi|en|zh>                  name language (default: vi)

cohort options (deterministic affinity matrix, offline):
  --input  <file>                      .csv or .json batch input
  --format <text|markdown|json|html>   output format (default: text)
  --lang   <vi|en|zh>                  name language (default: vi)

read options (AI interpretation, needs an OpenAI-compatible key):
  --lang     <vi|en>              answer language (default: vi)
  --sections <a,b,c>              subset of: overview,career,love,health,fortune,advice
  Reads env: TUVI_AI_API_KEY, TUVI_AI_BASE_URL, TUVI_AI_MODEL

Birth hour is the two-hour branch index: 0 = Ty (23:00-01:00) ... 11 = Hoi.
Run "ziwei hours" to list them.`;

interface ChartArgs {
  date?: string;
  hour?: string;
  gender?: string;
  format?: string;
  lang?: string;
  sections?: string;
  target?: string;
}

function parseChartArgs(rest: string[]): ChartArgs {
  const { values } = parseArgs({
    args: rest,
    options: {
      date: { type: 'string' },
      hour: { type: 'string' },
      gender: { type: 'string' },
      format: { type: 'string' },
      lang: { type: 'string' },
      sections: { type: 'string' },
      target: { type: 'string' },
    },
    allowPositionals: false,
  });
  return values as ChartArgs;
}

function toGender(v: string | undefined): Gender {
  if (v === 'male' || v === 'female') return v;
  throw new InvalidBirthInputError(`--gender must be male|female, got "${String(v)}"`);
}

function toFormat(v: string | undefined): ChartFormat {
  if (v === undefined) return 'text';
  if (v === 'text' || v === 'markdown' || v === 'json' || v === 'html') return v;
  throw new InvalidBirthInputError(
    `--format must be text|markdown|json|html, got "${v}"`,
  );
}

function toLang(v: string | undefined): Lang {
  if (v === undefined || v === 'vi' || v === 'vi-VN') return 'vi-VN';
  if (v === 'en' || v === 'en-US') return 'en-US';
  if (v === 'zh' || v === 'zh-CN') return 'zh-CN';
  throw new InvalidBirthInputError(`--lang must be vi|en|zh, got "${v}"`);
}

function chartInputFrom(args: ChartArgs): {
  date: string;
  hourIndex: number;
  gender: Gender;
  lang: Lang;
} {
  if (!args.date) throw new InvalidBirthInputError('--date is required (YYYY-MM-DD)');
  if (args.hour === undefined) throw new InvalidBirthInputError('--hour is required (0-11)');
  const hourIndex = Number(args.hour);
  return {
    date: args.date,
    hourIndex,
    gender: toGender(args.gender),
    lang: toLang(args.lang),
  };
}

function printHours(io: CliIO): void {
  io.log('Birth-hour branches (index: branch - animal - range):');
  for (const h of BIRTH_HOURS) {
    io.log(`  ${String(h.index).padStart(2)}: ${h.branch} - ${h.animal} - ${h.range}`);
  }
}

function cmdChart(rest: string[], io: CliIO): number {
  const args = parseChartArgs(rest);
  const input = chartInputFrom(args);
  const format = toFormat(args.format);
  const chart = calculateChart(input);
  io.log(formatChart(chart, { format }));
  return 0;
}

function cmdAnalyze(rest: string[], io: CliIO): number {
  const args = parseChartArgs(rest);
  const input = chartInputFrom(args);
  const format = toFormat(args.format);
  const chart = calculateChart(input);
  io.log(formatAnalysis(analyzeChart(chart), { format, lang: input.lang }));
  return 0;
}

function cmdHoroscope(rest: string[], io: CliIO): number {
  const args = parseChartArgs(rest);
  const input = chartInputFrom(args);
  const format = toFormat(args.format);
  const horoscope = calculateHoroscope(input, args.target ?? input.date);
  io.log(formatHoroscope(horoscope, { format, lang: input.lang }));
  return 0;
}

interface BatchArgs {
  input?: string;
  format?: string;
}

function batchEntriesFromFile(input: string) {
  const text = readFileSync(input, 'utf8');
  return /\.json$/i.test(input) ? parseBatchJson(text) : parseBatchCsv(text);
}

function cmdBatch(rest: string[], io: CliIO): number {
  const { values } = parseArgs({
    args: rest,
    options: {
      input: { type: 'string' },
      format: { type: 'string' },
    },
    allowPositionals: false,
  });
  const args = values as BatchArgs;
  if (!args.input) {
    throw new InvalidBirthInputError('--input <births.csv|.json> is required');
  }
  const results = calculateBatch(batchEntriesFromFile(args.input));
  const format = args.format ?? 'jsonl';
  if (format === 'json') {
    io.log(JSON.stringify(results, null, 2));
  } else if (format === 'jsonl') {
    io.log(toJsonl(results));
  } else {
    throw new InvalidBirthInputError(`--format must be jsonl|json, got "${format}"`);
  }
  const failed = results.filter((r) => !r.ok).length;
  return failed > 0 ? 1 : 0;
}

interface CompareArgs {
  date1?: string;
  hour1?: string;
  gender1?: string;
  date2?: string;
  hour2?: string;
  gender2?: string;
  format?: string;
  lang?: string;
}

function toComparisonFormat(v: string | undefined): ComparisonFormat {
  if (v === undefined || v === 'text') return 'text';
  if (v === 'markdown' || v === 'json') return v;
  throw new InvalidBirthInputError(`--format must be text|markdown|json, got "${v}"`);
}

function cmdCompare(rest: string[], io: CliIO): number {
  const { values } = parseArgs({
    args: rest,
    options: {
      date1: { type: 'string' },
      hour1: { type: 'string' },
      gender1: { type: 'string' },
      date2: { type: 'string' },
      hour2: { type: 'string' },
      gender2: { type: 'string' },
      format: { type: 'string' },
      lang: { type: 'string' },
    },
    allowPositionals: false,
  });
  const args = values as CompareArgs;
  const one = chartInputFrom({
    date: args.date1,
    hour: args.hour1,
    gender: args.gender1,
    lang: args.lang,
  });
  const two = chartInputFrom({
    date: args.date2,
    hour: args.hour2,
    gender: args.gender2,
    lang: args.lang,
  });
  const cmp = compareCharts(calculateChart(one), calculateChart(two));
  io.log(formatComparison(cmp, { format: toComparisonFormat(args.format) }));
  return 0;
}

interface CohortArgs {
  input?: string;
  format?: string;
  lang?: string;
}

function cmdCohort(rest: string[], io: CliIO): number {
  const { values } = parseArgs({
    args: rest,
    options: {
      input: { type: 'string' },
      format: { type: 'string' },
      lang: { type: 'string' },
    },
    allowPositionals: false,
  });
  const args = values as CohortArgs;
  if (!args.input) {
    throw new InvalidBirthInputError('--input <births.csv|.json> is required');
  }
  const lang = toLang(args.lang);
  const entries = batchEntriesFromFile(args.input).map((entry) => ({
    ...entry,
    input: { ...entry.input, lang: entry.input.lang ?? lang },
  }));
  const results = calculateBatch(entries);
  const charts = [];
  const labels = [];
  let failed = false;
  for (let i = 0; i < results.length; i += 1) {
    const result = results[i]!;
    if (result.ok) {
      charts.push(result.chart);
      labels.push(result.label ?? `chart ${i + 1}`);
    } else {
      failed = true;
      const label = result.label ? ` (${result.label})` : '';
      io.error(`row ${i + 1}${label}: ${result.error}`);
    }
  }
  if (failed) return 1;
  io.log(formatCohort(compareCohort(charts), labels, { format: toFormat(args.format), lang }));
  return 0;
}

async function buildClientFromEnv(): Promise<ChatClient | null> {
  const apiKey = process.env.TUVI_AI_API_KEY;
  if (!apiKey) return null;
  const baseURL = process.env.TUVI_AI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.TUVI_AI_MODEL || 'gpt-4o-mini';
  const { default: OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey, baseURL });
  return {
    async chat(system: string, user: string): Promise<string> {
      const res = await client.chat.completions.create({
        model,
        temperature: 0.8,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });
      return res.choices[0]?.message?.content ?? '';
    },
  };
}

async function cmdRead(rest: string[], io: CliIO): Promise<number> {
  const args = parseChartArgs(rest);
  const input = chartInputFrom(args);
  const client = await buildClientFromEnv();
  if (!client) {
    io.error(
      'No AI key found. Set TUVI_AI_API_KEY (and optionally TUVI_AI_BASE_URL / TUVI_AI_MODEL).\n' +
        'The "ziwei chart" command works without any key.',
    );
    return 1;
  }
  const sections = args.sections
    ? (args.sections.split(',').map((s) => s.trim()) as SectionKey[])
    : undefined;
  const chart = calculateChart(input);
  const lang = args.lang === 'en' ? 'en' : 'vi';
  const results = await interpretChart(chart, {
    client,
    sections,
    lang,
    onProgress: (done, total, title) => io.error(`[${done}/${total}] ${title}...`),
  });
  for (const r of results) {
    io.log(`\n## ${r.icon} ${r.title}\n`);
    io.log(r.content);
  }
  return 0;
}

/**
 * Run the CLI. Returns the process exit code; output goes through `io` so it can
 * be captured in tests.
 */
export async function run(argv: string[], io: CliIO = DEFAULT_IO): Promise<number> {
  const [command, ...rest] = argv;
  try {
    switch (command) {
      case undefined:
      case '-h':
      case '--help':
        io.log(HELP);
        return 0;
      case '-v':
      case '--version':
        io.log(VERSION);
        return 0;
      case 'hours':
        printHours(io);
        return 0;
      case 'chart':
        return cmdChart(rest, io);
      case 'analyze':
        return cmdAnalyze(rest, io);
      case 'horoscope':
        return cmdHoroscope(rest, io);
      case 'batch':
        return cmdBatch(rest, io);
      case 'compare':
        return cmdCompare(rest, io);
      case 'cohort':
        return cmdCohort(rest, io);
      case 'read':
        return await cmdRead(rest, io);
      default:
        io.error(`Unknown command: ${command}`);
        io.log(HELP);
        return 1;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    io.error(`Error: ${message}`);
    return 1;
  }
}

// Execute only when run as the entry point (not when imported by tests).
const isMain =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  /cli\.(c?js|ts)$/.test(process.argv[1] ?? '');

if (isMain) {
  run(process.argv.slice(2)).then((code) => process.exit(code));
}
