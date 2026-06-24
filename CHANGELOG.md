# Changelog

All notable changes to the **0G Testing Hub** program (docs, intake, site, and
automation) are recorded here.

This is a program repo, not a code project — entries track changes to the
testing model, defect intake, reward structure, target list, and the docs site,
not software releases. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Dates are the dates the
change landed on the default branch.

---

## [1.1.0] — Season 1 launch cleanup — 2026-06-24

### Added
- **Recruit-first Quick start.** Added a participant-facing flow diagram and
  simplified first-run path: intake → two feedback forms → Recruit → defect
  reports after L0.
- **Live links and submission map.** Added explicit links for feedback forms,
  the defect form, the org defect board, level rules, and Season 1 rewards.
- **Reward visuals.** Added reward workflow and reward-level images under
  `Assets/` and updated `README.md` to load them from the shared asset folder.

### Changed
- **Consolidated the README.** Merged repeated guidance about L0, accepted
  defects, submission links, boundaries, and non-accepted reports into a
  shorter six-section structure.
- **Simplified the reward ladder.** Replaced the old L0→L5 unlock model with
  the current L0→L3 model: L0 feedback-only, L1 with 1 accepted App Suite
  defect, L2 with 2 accepted App Suite + 0G Infra defects, and L3 with 5+
  accepted defects including 1 `systemic` finding.
- **Reframed Season 1 intake.** Marked the current testing intake URL as
  pending, updated the App Suite / Studio and 0G Private Computer Feedback
  links, and made the defect form URL include the `defect` label parameter.
- **Tightened defect routing.** Updated README, `LEVELS.md`, `TRIAGE.md`,
  issue forms, severity docs, and defect templates around accepted, deduped,
  reproducible defects as the reward signal after Recruit.
- **Moved board automation to the org project.** Updated triage docs and setup
  script references from the old user project to
  `0gfoundation` Project #19, including the required `project` + `repo` +
  `read:org` token scope and organization GraphQL lookups.
- **Aligned test target data.** Updated `data/targets.json` for the current
  Recruit/L1+ flow and changed the drift check to read from root
  `data/targets.json`.
- **Consolidated AI agent guidance.** Made `AGENTS.md` the canonical agent
  instruction file and reduced `CLAUDE.md` to a pointer to avoid drift.

### Removed
- **Hackathon dApps from the active Season 1 scope.** Removed the Hackathon
  routing bucket from current target data, issue form choices, label taxonomy,
  severity docs, and defect template guidance.
- **Retired ladder and reward language.** Removed L4/L5, leaderboard-gated
  Master, badge/equipment promises, physical reward/shipping references, and
  retired form URLs from the active docs.

---

## [1.0.0] — 0G Testing Hub — 2026-06-06

The program was rebranded from a single APAC test round into an evergreen,
season-based testing hub with a level ladder.

### Added
- **Season model + level ladder.** Evergreen mechanics in `LEVELS.md`;
  per-season specifics under `seasons/<active>/` (Season 1 = `2026-apac`).
- **Rebuilt docs site** for the Testing Hub model.
- **Intake operating model** documented: core-product bugs → Hub GitHub form,
  feedback → each project's own form, record-only dApp bugs → dApp channels.

### Changed
- Site footer note → `© 2026 0G Labs`.

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
