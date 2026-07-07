import { astro } from 'iztro';
import { InvalidBirthInputError } from './chart.js';
import type {
  BirthInput,
  Gender,
  Horoscope,
  HoroscopePalace,
  HoroscopeTransformation,
  Lang,
  Palace,
  Star,
} from './types.js';

/** Rendering format for {@link formatHoroscope}. */
export type HoroscopeFormat = 'text' | 'markdown' | 'json' | 'html';

export interface HoroscopeFormatOptions {
  format?: HoroscopeFormat;
  lang?: Lang;
}

interface RawHoroscopeItem {
  index?: number;
  heavenlyStem?: string;
  earthlyBranch?: string;
  mutagen?: string[];
}

interface RawHoroscope {
  solarDate?: string;
  lunarDate?: string;
  decadal?: RawHoroscopeItem;
  yearly?: RawHoroscopeItem;
}

interface RawDecadal {
  range?: [number, number];
  heavenlyStem?: string;
  earthlyBranch?: string;
}

interface RawPalace {
  name?: string;
  heavenlyStem?: string;
  earthlyBranch?: string;
  decadal?: RawDecadal;
  majorStars?: Star[];
  minorStars?: Star[];
  adjectiveStars?: Star[];
}

interface RawAstrolabe {
  solarDate?: string;
  palaces?: RawPalace[];
  horoscope?: (date?: string | Date, timeIndex?: number) => RawHoroscope;
}

const GENDER_TO_IZTRO: Record<Gender, string> = { male: '男', female: '女' };
const DATE_RE = /^\d{4}-\d{1,2}-\d{1,2}$/;
const YEAR_RE = /^\d{4}$/;
const TRANSFORMATION_KINDS: HoroscopeTransformation['kind'][] = [
  'loc',
  'quyen',
  'khoa',
  'ky',
];

function validateBirth(input: BirthInput): void {
  if (!DATE_RE.test(input.date)) {
    throw new InvalidBirthInputError(
      `date must be in YYYY-MM-DD format, got "${input.date}"`,
    );
  }
  if (
    !Number.isInteger(input.hourIndex) ||
    input.hourIndex < 0 ||
    input.hourIndex > 11
  ) {
    throw new InvalidBirthInputError(
      `hourIndex must be an integer 0..11, got ${input.hourIndex}`,
    );
  }
  if (input.gender !== 'male' && input.gender !== 'female') {
    throw new InvalidBirthInputError(
      `gender must be "male" or "female", got "${String(input.gender)}"`,
    );
  }
}

function normalizeTargetDate(birthDate: string, targetDate: string): string {
  if (YEAR_RE.test(targetDate)) {
    const [, month, day] = birthDate.split('-');
    return `${targetDate}-${month}-${day}`;
  }
  if (!DATE_RE.test(targetDate)) {
    throw new InvalidBirthInputError(
      `targetDate must be YYYY or YYYY-MM-DD, got "${targetDate}"`,
    );
  }
  return targetDate;
}

function palaceFrom(
  rawPalaces: RawPalace[],
  item: RawHoroscopeItem | undefined,
): HoroscopePalace {
  const index = item?.index ?? -1;
  const raw = rawPalaces[index];
  const out: HoroscopePalace = {
    index,
    name: raw?.name ?? '',
    heavenlyStem: item?.heavenlyStem ?? raw?.heavenlyStem ?? '',
    earthlyBranch: item?.earthlyBranch ?? raw?.earthlyBranch ?? '',
  };
  const range = raw?.decadal?.range;
  if (range) out.range = `${range[0]}-${range[1]}`;
  return out;
}

function starNames(raw: RawPalace | Palace | undefined): string[] {
  if (!raw) return [];
  return [
    ...(raw.majorStars ?? []),
    ...(raw.minorStars ?? []),
    ...(raw.adjectiveStars ?? []),
  ].map((s) => s.name);
}

function findStarPalace(rawPalaces: RawPalace[], star: string): HoroscopePalace | null {
  for (let i = 0; i < rawPalaces.length; i += 1) {
    const raw = rawPalaces[i];
    if (!starNames(raw).includes(star)) continue;
    return {
      index: i,
      name: raw?.name ?? '',
      heavenlyStem: raw?.heavenlyStem ?? '',
      earthlyBranch: raw?.earthlyBranch ?? '',
    };
  }
  return null;
}

function transformations(
  rawPalaces: RawPalace[],
  yearly: RawHoroscopeItem | undefined,
): HoroscopeTransformation[] {
  return (yearly?.mutagen ?? []).slice(0, 4).map((star, i) => ({
    kind: TRANSFORMATION_KINDS[i] ?? 'ky',
    star,
    palace: findStarPalace(rawPalaces, star),
  }));
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function dateForDisplay(date: string): string {
  return date
    .split('-')
    .map((part, i) => (i === 0 ? part : part.padStart(2, '0')))
    .join('-');
}

function palaceLabel(p: HoroscopePalace | null): string {
  if (!p) return 'not found';
  return `${p.name} (${p.heavenlyStem} ${p.earthlyBranch})`;
}

function toText(h: Horoscope): string {
  const out: string[] = [];
  out.push('=== ZI WEI HOROSCOPE TIMING ===');
  out.push(`Birth date : ${h.birthDate}`);
  out.push(`Target date: ${h.targetDate}`);
  if (h.lunarDate) out.push(`Lunar date : ${h.lunarDate}`);
  out.push('');
  out.push(`Decade palace: ${palaceLabel(h.decadal)}${h.decadal.range ? ` (${h.decadal.range})` : ''}`);
  out.push(`Annual palace: ${palaceLabel(h.annual)}`);
  out.push('');
  out.push('Annual four transformations:');
  for (const t of h.annualTransformations) {
    out.push(`  ${t.kind}: ${t.star} -> ${palaceLabel(t.palace)}`);
  }
  return out.join('\n');
}

function toMarkdown(h: Horoscope): string {
  const out: string[] = [
    '# Zi Wei horoscope timing',
    '',
    `- **Birth date:** ${h.birthDate}`,
    `- **Target date:** ${h.targetDate}`,
  ];
  if (h.lunarDate) out.push(`- **Lunar date:** ${h.lunarDate}`);
  out.push('');
  out.push(`- **Decade palace:** ${palaceLabel(h.decadal)}${h.decadal.range ? ` (${h.decadal.range})` : ''}`);
  out.push(`- **Annual palace:** ${palaceLabel(h.annual)}`);
  out.push('');
  out.push('## Annual four transformations');
  for (const t of h.annualTransformations) {
    out.push(`- **${t.kind}:** ${t.star} -> ${palaceLabel(t.palace)}`);
  }
  return out.join('\n');
}

function transformationHtml(t: HoroscopeTransformation): string {
  return `<tr><td>${esc(t.kind)}</td><td>${esc(t.star)}</td><td>${esc(
    palaceLabel(t.palace),
  )}</td></tr>`;
}

function toHtml(h: Horoscope): string {
  const rows = h.annualTransformations.map(transformationHtml).join('');
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Zi Wei Horoscope Timing - ${esc(h.targetDate)}</title>
<style>
:root{--bg:#101216;--panel:#1c2028;--ink:#eceff4;--mut:#a7afbd;--line:#303641;--acc:#d8b24a}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:24px}
h1{font-size:22px;margin:0 0 4px}
.sub{color:var(--mut);margin:0 0 18px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:0 0 18px}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:14px}
.label{color:var(--mut);font-size:12px;text-transform:uppercase}
.value{font-size:17px;font-weight:700;margin-top:2px}
table{width:100%;border-collapse:collapse;background:var(--panel);border:1px solid var(--line);border-radius:8px;overflow:hidden}
th,td{text-align:left;padding:10px;border-bottom:1px solid var(--line)}
th{color:var(--mut);font-size:12px;text-transform:uppercase}
tr:last-child td{border-bottom:0}
td:first-child{color:var(--acc);font-weight:700}
footer{color:var(--mut);font-size:12px;margin-top:18px}
</style>
</head>
<body>
<h1>Zi Wei Horoscope Timing</h1>
<p class="sub">${esc(h.birthDate)} -> ${esc(h.targetDate)}${h.lunarDate ? ` · ${esc(h.lunarDate)}` : ''}</p>
<section class="grid">
<div class="panel"><div class="label">Decade palace</div><div class="value">${esc(palaceLabel(h.decadal))}</div><div class="sub">${esc(h.decadal.range ?? '')}</div></div>
<div class="panel"><div class="label">Annual palace</div><div class="value">${esc(palaceLabel(h.annual))}</div></div>
</section>
<table>
<thead><tr><th>Transformation</th><th>Star</th><th>Target palace</th></tr></thead>
<tbody>${rows}</tbody>
</table>
<footer>Generated by ziwei-cli - deterministic, offline, no key.</footer>
</body>
</html>`;
}

/**
 * Calculate the active decadal palace, annual palace and annual four
 * transformations for a natal chart at a target solar date. `targetDate`
 * accepts `YYYY-MM-DD` or a bare `YYYY`; a bare year reuses the birth month/day.
 */
export function calculateHoroscope(input: BirthInput, targetDate: string): Horoscope {
  validateBirth(input);
  const lang: Lang = input.lang ?? 'vi-VN';
  const normalizedTargetDate = normalizeTargetDate(input.date, targetDate);

  const raw = astro.bySolar(
    input.date,
    input.hourIndex,
    GENDER_TO_IZTRO[input.gender] as Parameters<typeof astro.bySolar>[2],
    true,
    lang as Parameters<typeof astro.bySolar>[4],
  ) as unknown as RawAstrolabe;

  const rawHoroscope = raw.horoscope?.(normalizedTargetDate) ?? {};
  const rawPalaces = raw.palaces ?? [];
  return {
    birthDate: raw.solarDate ?? input.date,
    targetDate: dateForDisplay(rawHoroscope.solarDate ?? normalizedTargetDate),
    lunarDate: rawHoroscope.lunarDate ?? '',
    decadal: palaceFrom(rawPalaces, rawHoroscope.decadal),
    annual: palaceFrom(rawPalaces, rawHoroscope.yearly),
    annualTransformations: transformations(rawPalaces, rawHoroscope.yearly),
  };
}

/** Render a horoscope as text, Markdown, pretty JSON, or self-contained HTML. */
export function formatHoroscope(
  horoscope: Horoscope,
  opts: HoroscopeFormatOptions = {},
): string {
  switch (opts.format ?? 'text') {
    case 'json':
      return JSON.stringify(horoscope, null, 2);
    case 'markdown':
      return toMarkdown(horoscope);
    case 'html':
      return toHtml(horoscope);
    case 'text':
    default:
      return toText(horoscope);
  }
}
