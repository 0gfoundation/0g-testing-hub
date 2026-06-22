# Changelog

All notable changes to the **0G Testing Hub** program (docs, intake, site, and
automation) are recorded here.

This is a program repo, not a code project — entries track changes to the
testing model, defect intake, reward structure, target list, and the docs site,
not software releases. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Dates are the dates the
change landed on the default branch.

---

## [1.0.0] — 0G Testing Hub — 2026-06-06

The program was rebranded from a single APAC test round into an evergreen,
season-based testing hub with a level ladder.

### Added
- **Season model + L0→L5 level ladder.** Evergreen mechanics in `LEVELS.md`;
  per-season specifics under `seasons/<active>/` (Season 1 = `2026-apac`).
- **0G Private Computer Feedback** required at every level — run a model on
  0G Compute once and submit feedback.
- **Rebuilt docs site** for the Testing Hub model.
- **Intake operating model** documented: core-product bugs → Hub GitHub form,
  feedback → each project's own form, record-only dApp bugs → dApp channels.

### Changed
- Site footer note → `© 2026 0G Labs`.
- Propagated the **0G Private Computer Feedback** naming across `LEVELS.md`.

### Removed
- **English-only cleanup** — removed all Chinese text from tracked docs and site.

---

## [0.4.0] — Landing site — 2026-06-05

### Added
- **Testers landing site** (static, Vercel-ready) under `docs/`.
- **0G Studio Feedback form** wired up for the App Suite.
- **Vercel config** (`docs/vercel.json`): `cleanUrls` + data cache header,
  Root Directory = `docs`.
- Site dashboard data refresh pipeline.

---

## [0.3.0] — Structured intake + board automation — 2026-06-04

### Added
- **Auto-add defect issues to the project board** via GitHub Actions.
- **Fully automated Project board setup** in the setup script (driven through
  the GraphQL API).
- **Audience router map** at the top of the README.
- **"What a good run looks like"** program success metrics.
- **0G Code to Coin (0g-cc)** added as a first-party test target (routed under
  **0G Infra**) and a per-category test focus on the Test targets list.

### Changed
- Demoted brand / terminology from a red line to a **house-style** footnote.
- Reconciled the **T3 "done"** bar with the **Closed** state in the flow diagrams.
- Clarified that board-landing is automatic; labels are applied at triage.

### Removed
- Removed the `0g-dapp-test-claude.md` brief from the repo.

---

## [0.2.0] — Quality-based intake — 2026-06-03

### Added
- **Structured defect intake** via GitHub Issue Form, with labels, project
  board, and **quality-based rewards**.
- English **participation & submission flows** in the README.
- First two Test Week defects filed.

### Changed
- README now leads with goal + reward tiers; sign-up / feedback links added.
- De-duplicated Quick links vs. How to take part.

---

## [0.1.0] — Initial QA brief — 2026-06-01 → 06-02

### Added
- Initial **0G ecosystem QA brief** (`CLAUDE.md`) and README mirror.
- **P1–P4 severity rubric** and a structured (YAML) defect template.
- **Hackathon dApp** routing bucket in `CLAUDE.md`.

### Changed
- README translated to English; test targets and rewards updated.
