/**
 * Core domain types for a Zi Wei Dou Shu (紫微斗数 / Tử Vi Đẩu Số) natal chart.
 *
 * The chart engine wraps {@link https://github.com/SylarLong/iztro | iztro}; these
 * types are the stable, typed surface the rest of the library and CLI build on.
 */

/** Biological gender used by the traditional chart rules. */
export type Gender = 'male' | 'female';

/** Output language for star/palace names (passed through to iztro). */
export type Lang = 'vi-VN' | 'en-US' | 'zh-CN';

/** Input needed to compute a chart. */
export interface BirthInput {
  /** Solar (Gregorian) birth date as `YYYY-MM-DD`. */
  date: string;
  /** Birth two-hour branch index, 0 = Tý (23:00–01:00) … 11 = Hợi (21:00–23:00). */
  hourIndex: number;
  /** Biological gender. */
  gender: Gender;
  /** Name localisation; defaults to `vi-VN`. */
  lang?: Lang;
}

/** A single star sitting in a palace. */
export interface Star {
  name: string;
  /** Brightness / 廟旺 level, when iztro provides one. */
  brightness?: string;
  /** Four-transformation (Tứ Hóa) marker, e.g. `Lộc`, `Quyền`, `Khoa`, `Kỵ`. */
  mutagen?: string;
}

/** A 10-year major period (Đại hạn / 大限) anchored on a palace. */
export interface Decadal {
  /** Age range covered, e.g. `6-15`. */
  range: string;
  heavenlyStem: string;
  earthlyBranch: string;
}

/** One of the twelve palaces (cung / 宫) of the chart. */
export interface Palace {
  name: string;
  heavenlyStem: string;
  earthlyBranch: string;
  /** Whether this palace also hosts the Body (Thân) star. */
  isBodyPalace: boolean;
  /** Major stars (chính tinh). */
  majorStars: Star[];
  /** Minor stars (phụ tinh). */
  minorStars: Star[];
  /** Miscellaneous stars (tạp diệu). */
  adjectiveStars: Star[];
  decadal: Decadal | null;
}

/** A fully computed natal chart. */
export interface Chart {
  /** Solar date echoed back by the engine. */
  solarDate: string;
  /** Lunar date string, when available. */
  lunarDate: string;
  gender: Gender;
  /** Soul star (Mệnh chủ). */
  soul: string;
  /** Body star (Thân chủ). */
  body: string;
  /** Five-elements class (Ngũ hành cục). */
  fiveElementsClass: string;
  /** The twelve palaces, in engine order. */
  palaces: Palace[];
}

/** The twelve birth two-hour branches (địa chi giờ). */
export const BIRTH_HOURS: ReadonlyArray<{
  index: number;
  branch: string;
  animal: string;
  range: string;
}> = [
  { index: 0, branch: 'Tý', animal: 'Rat', range: '23:00–01:00' },
  { index: 1, branch: 'Sửu', animal: 'Ox', range: '01:00–03:00' },
  { index: 2, branch: 'Dần', animal: 'Tiger', range: '03:00–05:00' },
  { index: 3, branch: 'Mão', animal: 'Rabbit', range: '05:00–07:00' },
  { index: 4, branch: 'Thìn', animal: 'Dragon', range: '07:00–09:00' },
  { index: 5, branch: 'Tỵ', animal: 'Snake', range: '09:00–11:00' },
  { index: 6, branch: 'Ngọ', animal: 'Horse', range: '11:00–13:00' },
  { index: 7, branch: 'Mùi', animal: 'Goat', range: '13:00–15:00' },
  { index: 8, branch: 'Thân', animal: 'Monkey', range: '15:00–17:00' },
  { index: 9, branch: 'Dậu', animal: 'Rooster', range: '17:00–19:00' },
  { index: 10, branch: 'Tuất', animal: 'Dog', range: '19:00–21:00' },
  { index: 11, branch: 'Hợi', animal: 'Pig', range: '21:00–23:00' },
] as const;
