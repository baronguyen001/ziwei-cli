import { astro } from 'iztro';
import type { BirthInput, Chart, Gender, Lang, Palace, Star } from './types.js';

/**
 * Minimal shape we read off an iztro astrolabe. iztro ships its own richer
 * types, but pinning to them couples us to its exact version; instead we read
 * the handful of fields we need through one controlled boundary cast.
 */
interface RawStar {
  name?: string;
  brightness?: string;
  mutagen?: string;
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
  isBodyPalace?: boolean;
  majorStars?: RawStar[];
  minorStars?: RawStar[];
  adjectiveStars?: RawStar[];
  decadal?: RawDecadal;
}
interface RawAstrolabe {
  solarDate?: string;
  lunarDate?: string;
  soul?: string;
  body?: string;
  fiveElementsClass?: string;
  palaces?: RawPalace[];
}

const GENDER_TO_IZTRO: Record<Gender, string> = { male: '男', female: '女' };

const DATE_RE = /^\d{4}-\d{1,2}-\d{1,2}$/;

/** Thrown when {@link calculateChart} is given invalid input. */
export class InvalidBirthInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidBirthInputError';
  }
}

function validate(input: BirthInput): void {
  if (!DATE_RE.test(input.date)) {
    throw new InvalidBirthInputError(
      `date must be in YYYY-MM-DD format, got "${input.date}"`,
    );
  }
  const parts = input.date.split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) {
    throw new InvalidBirthInputError(`date out of range: "${input.date}"`);
  }
  if (
    !Number.isInteger(input.hourIndex) ||
    input.hourIndex < 0 ||
    input.hourIndex > 11
  ) {
    throw new InvalidBirthInputError(
      `hourIndex must be an integer 0..11 (Tý..Hợi), got ${input.hourIndex}`,
    );
  }
  if (input.gender !== 'male' && input.gender !== 'female') {
    throw new InvalidBirthInputError(
      `gender must be "male" or "female", got "${String(input.gender)}"`,
    );
  }
}

function mapStar(raw: RawStar): Star {
  const star: Star = { name: raw.name ?? '' };
  if (raw.brightness) star.brightness = raw.brightness;
  if (raw.mutagen) star.mutagen = raw.mutagen;
  return star;
}

function mapStars(raw: RawStar[] | undefined): Star[] {
  return (raw ?? []).map(mapStar).filter((s) => s.name.length > 0);
}

function mapPalace(raw: RawPalace): Palace {
  let decadal: Palace['decadal'] = null;
  if (raw.decadal?.range) {
    decadal = {
      range: `${raw.decadal.range[0]}-${raw.decadal.range[1]}`,
      heavenlyStem: raw.decadal.heavenlyStem ?? '',
      earthlyBranch: raw.decadal.earthlyBranch ?? '',
    };
  }
  return {
    name: raw.name ?? '',
    heavenlyStem: raw.heavenlyStem ?? '',
    earthlyBranch: raw.earthlyBranch ?? '',
    isBodyPalace: Boolean(raw.isBodyPalace),
    majorStars: mapStars(raw.majorStars),
    minorStars: mapStars(raw.minorStars),
    adjectiveStars: mapStars(raw.adjectiveStars),
    decadal,
  };
}

/**
 * Compute a complete Zi Wei Dou Shu natal chart from a solar birth date,
 * two-hour branch index and gender. Deterministic and offline — no network or
 * API key is involved.
 *
 * @throws {InvalidBirthInputError} when the input fails validation.
 */
export function calculateChart(input: BirthInput): Chart {
  validate(input);
  const lang: Lang = input.lang ?? 'vi-VN';

  const raw = astro.bySolar(
    input.date,
    input.hourIndex,
    GENDER_TO_IZTRO[input.gender] as Parameters<typeof astro.bySolar>[2],
    true,
    lang as Parameters<typeof astro.bySolar>[4],
  ) as unknown as RawAstrolabe;

  const palaces = (raw.palaces ?? []).map(mapPalace);

  return {
    solarDate: raw.solarDate ?? input.date,
    lunarDate: raw.lunarDate ?? '',
    gender: input.gender,
    soul: String(raw.soul ?? ''),
    body: String(raw.body ?? ''),
    fiveElementsClass: String(raw.fiveElementsClass ?? ''),
    palaces,
  };
}
