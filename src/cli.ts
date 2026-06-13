#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { calculateChart, InvalidBirthInputError } from './chart.js';
import { formatChart, type ChartFormat } from './format.js';
import { interpretChart, type ChatClient, type SectionKey } from './ai.js';
import { BIRTH_HOURS, type Gender, type Lang } from './types.js';

const VERSION = '0.1.0';

export interface CliIO {
  log: (msg: string) => void;
  error: (msg: string) => void;
}

const DEFAULT_IO: CliIO = {
  log: (m) => console.log(m),
  error: (m) => console.error(m),
};

const HELP = `ziwei — Zi Wei Dou Shu (紫微斗数 / Tử Vi Đẩu Số) natal chart CLI

Usage:
  ziwei chart --date <YYYY-MM-DD> --hour <0-11> --gender <male|female> [options]
  ziwei read  --date <YYYY-MM-DD> --hour <0-11> --gender <male|female> [options]
  ziwei hours
  ziwei --help | --version

chart options:
  --format <text|markdown|json>   output format (default: text)
  --lang   <vi|en>                name language (default: vi)

read options (AI interpretation, needs an OpenAI-compatible key):
  --lang     <vi|en>              answer language (default: vi)
  --sections <a,b,c>              subset of: overview,career,love,health,fortune,advice
  Reads env: TUVI_AI_API_KEY, TUVI_AI_BASE_URL, TUVI_AI_MODEL

Birth hour is the two-hour branch index: 0 = Tý (23:00–01:00) … 11 = Hợi.
Run "ziwei hours" to list them.`;

interface ChartArgs {
  date?: string;
  hour?: string;
  gender?: string;
  format?: string;
  lang?: string;
  sections?: string;
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
  if (v === 'text' || v === 'markdown' || v === 'json') return v;
  throw new InvalidBirthInputError(`--format must be text|markdown|json, got "${v}"`);
}

function toLang(v: string | undefined): Lang {
  if (v === undefined || v === 'vi') return 'vi-VN';
  if (v === 'en') return 'en-US';
  throw new InvalidBirthInputError(`--lang must be vi|en, got "${v}"`);
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
  io.log('Birth-hour branches (index: branch — animal — range):');
  for (const h of BIRTH_HOURS) {
    io.log(`  ${String(h.index).padStart(2)}: ${h.branch} — ${h.animal} — ${h.range}`);
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
    onProgress: (done, total, title) => io.error(`[${done}/${total}] ${title}…`),
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
