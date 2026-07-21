# Changelog

All notable changes to **ziwei-cli** are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/).

## v0.4.0 - 2026-07-21

### Added
- **Four-transformations map** - `ziwei mutagen` plus
  `analyzeMutagens` / `formatMutagens` scan chart stars for Loc, Quyen, Khoa
  and Ky markers across Vietnamese, English and Chinese engine output, report
  their palace placements, and flag whether Ky lands on a life-axis palace.
- **Five-element branch balance** - `ziwei elements` plus
  `analyzeElements` / `formatElements` weight the twelve palace branches by
  star count, report dominant and deficient elements, echo the chart's
  five-elements class, and include a deterministic 0-100 balance score.
- **Batch CSV export** - `ziwei batch --format csv` and `toCsv` emit stable
  columns (`date,hour,gender,label,ok,soul,body,fiveElementsClass,error`) with
  CSV escaping and failed-row errors preserved.

### Notes
- All new features are deterministic, offline and require no API key.
- `mutagen` and `elements` output is structural/descriptive only, not advice.

## [0.3.0] - 2026-07-07

### Added
- **Horoscope timing layer** - `ziwei horoscope` plus
  `calculateHoroscope` / `formatHoroscope` expose the active decade palace,
  annual palace and annual four-transformation targets for a target solar date.
- **Cohort affinity** - `ziwei cohort` plus `compareCohort` / `formatCohort`
  compare many charts at once by reusing the existing pairwise `compareCharts`
  affinity score and rendering a matrix plus ranked pairs.
- **Structural analytics** - `ziwei analyze` plus `analyzeChart` /
  `formatAnalysis` summarize brightness counts, auspicious/inauspicious star
  tallies, empty palaces and per-palace star counts.

### Notes
- All three features are deterministic, offline and require no API key.
- `analyze` and cohort affinity output are structural/descriptive only, not
  advice or prediction.

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
