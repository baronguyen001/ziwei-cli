# ziwei-cli

> Compute a complete **Zi Wei Dou Shu** (紫微斗数 — known in Vietnamese as **Tử Vi Đẩu Số**) natal chart from a birth date, hour and gender — as structured data, not a screenshot.

[![CI](https://github.com/baronguyen001/ziwei-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/baronguyen001/ziwei-cli/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)

`ziwei-cli` is a small TypeScript **library + CLI** that turns a birth date/time into a fully computed Zi Wei Dou Shu chart: the **12 palaces** (cung), the **Soul/Body** stars (Mệnh/Thân), the **Five-Elements Class** (Ngũ hành cục), and the **decade periods** (Đại hạn) — each palace with its major, minor and miscellaneous stars and four-transformations (Tứ Hóa).

The chart engine is **deterministic and offline** (it wraps the excellent [`iztro`](https://github.com/SylarLong/iztro)). An **optional** AI command turns the chart into a written reading via any OpenAI-compatible endpoint — but you never need a key just to compute the chart.

---

## Why

Most Zi Wei Dou Shu tools render a picture you can only read with your eyes. `ziwei-cli` gives you the **chart as JSON** so you can build on top of it — a Telegram bot, a web app, a research notebook — plus a clean CLI and a tested, typed wrapper, and a pluggable AI reading layer you can point at your own model.

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

# The same chart as JSON — pipe it anywhere
ziwei chart --date 1990-05-20 --hour 6 --gender female --format json

# Markdown, with English star names
ziwei chart --date 1988-11-02 --hour 3 --gender male --format markdown --lang en

# List the 12 birth-hour branches
ziwei hours
```

The **birth hour** is the traditional two-hour branch index: `0 = Tý (23:00–01:00)` … `11 = Hợi (21:00–23:00)`. Run `ziwei hours` for the full table.

## Library usage

```ts
import { calculateChart, formatChart, BIRTH_HOURS } from 'ziwei-cli';

const chart = calculateChart({
  date: '1990-05-20',   // solar / Gregorian, YYYY-MM-DD
  hourIndex: 6,         // 0..11 (Tý..Hợi)
  gender: 'male',
  lang: 'vi-VN',        // or 'en-US' / 'zh-CN'
});

console.log(chart.soul, chart.body, chart.fiveElementsClass);
console.log(chart.palaces.length); // 12

// Render it however you like
console.log(formatChart(chart, { format: 'json' }));
```

Every field is typed (`Chart`, `Palace`, `Star`, `Decadal`, `BirthInput`). Invalid input throws a typed `InvalidBirthInputError`.

## Optional: AI reading

`ziwei read` (and the `interpretChart` function) produce a six-part written interpretation — Overview, Career & Wealth, Love & Family, Health & Fortune, Decade Outlook, Summary & Advice. It works with **any OpenAI-compatible API** (OpenAI, DeepSeek, Together, Groq, a local server…):

```bash
export TUVI_AI_API_KEY=sk-...
export TUVI_AI_BASE_URL=https://api.openai.com/v1   # or https://api.deepseek.com
export TUVI_AI_MODEL=gpt-4o-mini                    # or deepseek-chat
ziwei read --date 1990-05-20 --hour 6 --gender male --lang en
```

In code, the AI layer takes an injected client, so it stays testable and provider-agnostic:

```ts
import { calculateChart, interpretChart, type ChatClient } from 'ziwei-cli';

const client: ChatClient = {
  async chat(system, user) {
    // call your model of choice and return the text
    return await myModel(system, user);
  },
};

const sections = await interpretChart(calculateChart(input), { client, lang: 'en' });
```

## How it works

`calculateChart` is a thin, typed, validated wrapper over [`iztro`](https://github.com/SylarLong/iztro), which does the heavy astronomical/astrological computation. `ziwei-cli` adds: input validation, a stable typed surface, multi-format rendering, an optional injectable AI reading, and a CLI. All chart tests run fully offline against `iztro`’s deterministic output.

## Ideas to build on it

- A Telegram / Discord bot that DMs a chart + reading
- A web playground that renders the 12 palaces as a grid
- Batch research over many charts (everything is JSON)

## Contributing

Issues and PRs welcome. `npm ci && npm test && npm run lint && npm run typecheck` should pass.

## License

[MIT](./LICENSE) © baronguyen001

---

Part of a small toolkit of focused dev utilities — see **[Trawlkit](https://github.com/baronguyen001)** for the rest.
