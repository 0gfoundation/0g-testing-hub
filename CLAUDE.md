# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

**Not a code project.** This directory runs the **0G Testing Hub** — a community-run, evergreen testing program across the 0G ecosystem. It runs in **seasons**; the current one is **Season 1 (2026 · APAC)**. Start with [`README.md`](./README.md) — it's the participant-facing source of truth (goal, levels, flows, test targets, defect template). There is no build, no tests, no lint, no package manager. The deliverable is **reproducible, routable defect intel** plus **0G Private Computer Feedback**, not source code.

**Program model.** Testers don't pick a fixed tier — they **climb a level ladder (L0→L5)**. The evergreen mechanics live in [`LEVELS.md`](./LEVELS.md); each season's specifics (Credit numbers, focus, intake forms, dates) live under [`seasons/<active>/`](./seasons/) — e.g. `seasons/2026-apac/`. All rewards are **0G Compute Credit** (no physical goods, no shipping); payout = the Credit of the highest level reached, badges accumulate. Every level also requires one **0G Private Computer Feedback** (run a model once + submit it).

If a future task drifts toward "let me write a script / set up a harness / refactor something here," stop and re-read the brief. The work product is filed defects, not code.

## Task state machine (must reach T3)

```
Not started -> happy path OK -> error paths in progress -> defect found (filed) -> routed / closed
```

- **T1** — Cover every target app's happy path + at least one error path. No blind spots.
- **T2** — Each finding filed via the [Defect report form](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=defect-report.yml) (fields mirror the template in `README.md` / `defects/TEMPLATE.md`). Reproducible or it doesn't count. "Felt off" ≠ defect.
- **T3** — Every defect tagged with ownership: **App Suite / 0G Infra / Ecosystem dApp / Hackathon dApp**.

Baseline each app against its **known stack state**, not against an imagined "production-ready" target — judging against the latter floods the queue with false positives.

## Hard boundaries (do not cross)

- **No feature requests.** "It'd be nice if…" gets cut. Exception: missing functionality that documentation already promised → that's a bug.
- **Never touch funds or keys.** For swap / bridge / faucet / sign flows, stop at the transaction confirmation screen. Do not sign, do not send.
- **Ecosystem dApps (TradeGPT / Jaine / Oku / etc.) are logged only.** Their bugs are not 0G's account — record but don't escalate as 0G defects.

**Wording (house style, not a boundary):** use "The Blockchain for AI Agents" and "onchain" (no hyphen); avoid legacy names. A miss here is a copy nit, not a boundary breach.

## Routing buckets (defect ownership)

- **0G App Suite** — 0G App, Genome, 0G Chat, PandaClaw
- **0G Infra** — 0G Hub, 0G Storage Scan, Chain Scan, 0G Code to Coin (0g-cc, the official MCP server → 0G Compute)
- **Ecosystem dApps** (record-only) — TradeGPT, Jaine, Oku, AI Arena, CARV, Cygnus Finance, DataHive, Khalani, Merkl
- **Hackathon dApps** (record-only) — 0g-kit, Blindmarket

URLs for each are in [`README.md` → Test targets](./README.md#test-targets) — pull them from there rather than guessing.

**Intake model (routing follows the deliverable):** core-product **bugs** (App Suite + Infra) are filed in the Hub's GitHub defect form — they drive Credit and cross-app systemic detection; **feedback** is owned by each project (their own form); **record-only** dApp bugs go to the dApp's own channel (Hub logs coverage only); **0G Private Computer Feedback** is required at every level. Full breakdown: [`README.md` → Where to submit](./README.md#where-to-submit--entry-map).

## Feedback calibration

- **SNR gate** — a round dominated by P3/P4 nits with no reproducible P1/P2 means the work has drifted into trivia. Pull back to core flows.
- **Aggregate repeated root causes** — when the same upstream issue (e.g. Chain ID 16661 missing from a mapping table, captcha token expiry causing UI contradictions) repeats across multiple apps, collapse "N defects" into **one systemic finding** and route it upstream (SDK / docs / config) instead of filing per-app.

## Defect template

The defect template (title / ownership / severity / environment / repro steps / expected / actual / screenshot / root-cause guess) lives in [`README.md`](./README.md#defect-filing-template-mandatory-for-every-t2-defect) and [`defects/TEMPLATE.md`](./defects/TEMPLATE.md); the [Defect report form](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=defect-report.yml) collects the same fields. Reproducibility and routing tag are mandatory; everything else is a quality lever.
