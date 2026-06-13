import type { Chart } from './types.js';
import { formatChart } from './format.js';

/**
 * Minimal chat interface the AI reading depends on. The CLI adapts the `openai`
 * SDK to this; tests inject a fake. Keeping the dependency this thin means the
 * library core never imports a network client and the reading is fully testable
 * offline.
 */
export interface ChatClient {
  chat(system: string, user: string): Promise<string>;
}

/** The six reading sections, lifted from the original Tử Vi bot design. */
export type SectionKey =
  | 'overview'
  | 'career'
  | 'love'
  | 'health'
  | 'fortune'
  | 'advice';

export interface SectionResult {
  key: SectionKey;
  title: string;
  icon: string;
  /** Model output, or an error notice if that section failed. */
  content: string;
  /** True when the section came back from a failed call. */
  failed: boolean;
}

interface SectionSpec {
  key: SectionKey;
  title: string;
  icon: string;
  focus: string;
}

export const SECTIONS: readonly SectionSpec[] = [
  {
    key: 'overview',
    title: 'Overview',
    icon: '🔮',
    focus:
      'the Soul (Mệnh) and Body (Thân) palaces, the Five-Elements Class, the overall pattern (cách cục), and core character.',
  },
  {
    key: 'career',
    title: 'Career & Wealth',
    icon: '💼',
    focus:
      'the Career (Quan Lộc) and Wealth (Tài Bạch) palaces — suitable professions, money style, and timing.',
  },
  {
    key: 'love',
    title: 'Love & Family',
    icon: '💕',
    focus:
      'the Spouse (Phu Thê), Children (Tử Tức), Parents (Phụ Mẫu) and Siblings (Huynh Đệ) palaces.',
  },
  {
    key: 'health',
    title: 'Health & Fortune',
    icon: '🏥',
    focus:
      'the Health (Tật Ách), Wellbeing (Phúc Đức) and Property (Điền Trạch) palaces — risks and how to balance them.',
  },
  {
    key: 'fortune',
    title: 'Decade Outlook',
    icon: '📅',
    focus:
      'the current and upcoming major periods (Đại hạn) — favourable versus cautious years and good windows for big decisions.',
  },
  {
    key: 'advice',
    title: 'Summary & Advice',
    icon: '⭐',
    focus:
      'strengths to lean on, weaknesses to manage, lucky directions, and a closing piece of advice.',
  },
] as const;

const LANG_NAME: Record<'vi' | 'en', string> = {
  vi: 'Vietnamese',
  en: 'English',
};

export interface InterpretOptions {
  client: ChatClient;
  /** Which sections to generate; defaults to all six in order. */
  sections?: SectionKey[];
  /** Language the model should answer in; defaults to `'vi'`. */
  lang?: 'vi' | 'en';
  /** Optional progress callback fired before each section. */
  onProgress?: (done: number, total: number, title: string) => void;
}

function systemPrompt(lang: 'vi' | 'en'): string {
  return [
    'You are a master of Zi Wei Dou Shu (紫微斗数 / Tử Vi Đẩu Số) with decades of',
    'experience interpreting natal charts grounded in the classical tradition.',
    'Write a clear, structured and insightful reading. Use Markdown headings and',
    'bullet points. Be specific to the stars and palaces given, not generic.',
    `Answer entirely in ${LANG_NAME[lang]}.`,
  ].join(' ');
}

function userPrompt(spec: SectionSpec, chartText: string, lang: 'vi' | 'en'): string {
  return [
    `Analyse the **${spec.title}** of this Zi Wei Dou Shu chart.`,
    `Focus on: ${spec.focus}`,
    `Answer in ${LANG_NAME[lang]}, at least a few hundred words.`,
    '',
    'CHART DATA:',
    chartText,
  ].join('\n');
}

function resolveSpecs(keys: SectionKey[] | undefined): SectionSpec[] {
  if (!keys || keys.length === 0) return [...SECTIONS];
  const byKey = new Map(SECTIONS.map((s) => [s.key, s]));
  const specs: SectionSpec[] = [];
  for (const k of keys) {
    const spec = byKey.get(k);
    if (spec) specs.push(spec);
  }
  return specs;
}

/**
 * Generate an AI interpretation of a chart, one section at a time. A failing
 * section is captured (with `failed: true`) rather than aborting the rest.
 */
export async function interpretChart(
  chart: Chart,
  opts: InterpretOptions,
): Promise<SectionResult[]> {
  const lang = opts.lang ?? 'vi';
  const specs = resolveSpecs(opts.sections);
  const chartText = formatChart(chart, { format: 'text' });
  const system = systemPrompt(lang);

  const results: SectionResult[] = [];
  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i]!;
    opts.onProgress?.(i + 1, specs.length, spec.title);
    try {
      const content = await opts.client.chat(system, userPrompt(spec, chartText, lang));
      results.push({ key: spec.key, title: spec.title, icon: spec.icon, content, failed: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({
        key: spec.key,
        title: spec.title,
        icon: spec.icon,
        content: `This section could not be generated (${message}).`,
        failed: true,
      });
    }
  }
  return results;
}
