# ziwei-cli

> Compute a complete **Zi Wei Dou Shu** natal chart from a birth date, hour and gender as structured data, not a screenshot.

[![CI](https://github.com/baronguyen001/ziwei-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/baronguyen001/ziwei-cli/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)

`ziwei-cli` is a small TypeScript **library + CLI** that turns a birth date/time into a fully computed Zi Wei Dou Shu chart: the 12 palaces, Soul/Body stars, Five-Elements Class, decade periods, stars, brightness and four-transformations.

The chart engine is **deterministic and offline** (it wraps [`iztro`](https://github.com/SylarLong/iztro)). An optional AI command turns the chart into a written reading via any OpenAI-compatible endpoint, but no key is needed for chart, batch, compare, horoscope, cohort or analyze output.

---

## Install

```bash
# use the CLI without installing
npx ziwei-cli chart --date 1990-05-20 --hour 6 --gender male

# or add the library to a project
npm install ziwei-cli
```

## CLI quickstart

```bash
# A chart as readable text (no API key needed)
ziwei chart --date 1990-05-20 --hour 6 --gender male

# The same chart as JSON
ziwei chart --date 1990-05-20 --hour 6 --gender female --format json

# Markdown, with English star names
ziwei chart --date 1988-11-02 --hour 3 --gender male --format markdown --lang en

# A self-contained HTML page (no JS, no external assets)
ziwei chart --date 1990-05-20 --hour 6 --gender male --format html > chart.html

# Timing layer: active decade palace, annual palace and annual transformations
ziwei horoscope --date 1990-05-20 --hour 6 --gender male --target 2026 --lang en

# Structural digest: brightness counts, star tallies and empty palaces
ziwei analyze --date 1990-05-20 --hour 6 --gender male --format markdown

# Compute many charts in one pass -> JSON Lines
ziwei batch --input births.csv
ziwei batch --input births.json --format json

# Compare two charts: shared stars/positions + illustrative affinity score
ziwei compare \
  --date1 1990-05-20 --hour1 6 --gender1 male \
  --date2 1988-11-02 --hour2 3 --gender2 female

# Compare many charts at once as an affinity matrix
ziwei cohort --input births.csv --format html > cohort.html

# List the 12 birth-hour branches
ziwei hours
```

The **birth hour** is the traditional two-hour branch index: `0 = Ty (23:00-01:00)` through `11 = Hoi (21:00-23:00)`. Run `ziwei hours` for the full table.

`births.csv` is `date,hour,gender[,lang][,label]` (an optional header row, `#` comments and blank lines are ignored). `births.json` is an array of `{ date, hour|hourIndex, gender, lang?, label? }`. Bad batch rows become error results instead of aborting the whole batch. `cohort` reuses the same input shape and reports bad rows clearly before producing a matrix.

The affinity score from `compare` and `cohort` is a deterministic structural heuristic for illustration, **not advice**. `analyze` is also structural/descriptive only and is **not advice**.

## Library usage

```ts
import {
  analyzeChart,
  calculateChart,
  calculateHoroscope,
  compareCohort,
  formatAnalysis,
  formatChart,
  formatCohort,
  formatHoroscope,
} from 'ziwei-cli';

const chart = calculateChart({
  date: '1990-05-20',   // solar / Gregorian, YYYY-MM-DD
  hourIndex: 6,         // 0..11
  gender: 'male',
  lang: 'en-US',        // or 'vi-VN' / 'zh-CN'
});

console.log(formatChart(chart, { format: 'json' }));

const timing = calculateHoroscope(
  { date: '1990-05-20', hourIndex: 6, gender: 'male', lang: 'en-US' },
  '2026',
);
console.log(formatHoroscope(timing, { format: 'markdown' }));

const analysis = analyzeChart(chart);
console.log(formatAnalysis(analysis));

const cohort = compareCohort([
  chart,
  calculateChart({ date: '1988-11-02', hourIndex: 3, gender: 'female', lang: 'en-US' }),
]);
console.log(formatCohort(cohort, ['alpha', 'beta'], { format: 'json' }));
```

Every field is typed (`Chart`, `Palace`, `Star`, `Decadal`, `BirthInput`, `Horoscope`, `ChartAnalysis`, `CohortComparison`). Invalid input throws a typed `InvalidBirthInputError`.

## Optional: AI reading

`ziwei read` and `interpretChart` produce a six-part written interpretation. It works with any OpenAI-compatible API:

```bash
export TUVI_AI_API_KEY=sk-...
export TUVI_AI_BASE_URL=https://api.openai.com/v1
export TUVI_AI_MODEL=gpt-4o-mini
ziwei read --date 1990-05-20 --hour 6 --gender male --lang en
```

In code, the AI layer takes an injected client, so it stays testable and provider-agnostic:

```ts
import { calculateChart, interpretChart, type ChatClient } from 'ziwei-cli';

const client: ChatClient = {
  async chat(system, user) {
    return await myModel(system, user);
  },
};

const sections = await interpretChart(calculateChart(input), { client, lang: 'en' });
```

## How it works

`calculateChart` is a thin, typed, validated wrapper over [`iztro`](https://github.com/SylarLong/iztro), which does the astronomical/astrological computation. `ziwei-cli` adds input validation, a stable typed surface, deterministic offline renderers, optional injectable AI reading, and a CLI. Tests run fully offline against deterministic output.

## Ideas to build on it

- A Telegram / Discord bot that DMs a chart + reading
- A web playground that renders the 12 palaces as a grid
- Batch research over many charts
- Timing dashboards using `calculateHoroscope`
- Offline structural summaries using `analyzeChart`

## Contributing

Run the same gate as CI:

```bash
npm ci
npm run lint
npm run typecheck
npm run test:cov
npm run build
```

## License

[MIT](./LICENSE) (c) baronguyen001

---

Part of a small toolkit of focused dev utilities - see **[Trawlkit](https://github.com/baronguyen001)** for the rest.
