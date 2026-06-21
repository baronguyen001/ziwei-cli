# Changelog

All notable changes to **ziwei-cli** are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-06-21

### Added
- **HTML output** for `formatChart` and `ziwei chart --format html`: a
  self-contained document (inlined CSS, **no JavaScript, no external assets**)
  rendering the summary header and the twelve palaces as a responsive card grid.
- **Batch mode** — `ziwei batch --input <births.csv|.json> [--format jsonl|json]`
  computes many charts in one pass. CSV columns are `date,hour,gender[,lang][,label]`
  (optional header, `#` comments and blank lines ignored); JSON accepts an array
  of `{ date, hour|hourIndex, gender, lang?, label? }`. Bad rows are captured as
  error results (never abort the batch) and the exit code is `1` if any row failed.
  New library exports: `parseBatchCsv`, `parseBatchJson`, `calculateBatch`, `toJsonl`.
- **Chart comparison (synastry)** — `ziwei compare --date1 … --date2 …` and the
  library `compareCharts` / `formatComparison`: a deterministic structural diff of
  two charts (Soul/Body/Five-Elements matches, common major stars, shared
  positions by branch, and an illustrative 0–100 affinity score). Text, Markdown
  and JSON output.

### Notes
- All new features are deterministic and offline — no API key is required.
- The affinity score is a structural heuristic for illustration, not advice.

## [0.1.0] - 2026-06-13

### Added
- Initial release: deterministic Zi Wei Dou Shu natal chart engine (wrapping
  `iztro`), text/Markdown/JSON rendering, an optional OpenAI-compatible AI
  reading, and the `ziwei` CLI (`chart`, `read`, `hours`).
