# 0g-testing-hub

This is the canonical AI agent instruction file for this repository. It mirrors [`README.md`](./README.md); treat the README as the participant-facing source of truth for goals, levels, flows, test targets, submission rules, and defect template.

## What this repo is

**Not a code project.** `0g-testing-hub` is a community-run testing program for 0G: submit required feedback, test target apps, file reproducible bugs, and climb L0-L3 for 0G Compute Credit. There is no build, no tests, no lint, and no package manager here. The deliverable is **required feedback plus reproducible, routable defect intel**, not source code.

If a task drifts toward "write a script / set up a harness / refactor something here," stop and re-read the README. The work product is filed defects and feedback, not application code.

## Levels and rewards

All rewards are **0G Compute Credit**. No physical goods, no shipping. Payout is the Credit of the **highest level reached**.

| Lv | Title | How it clears | Credit |
|----|-------|---------------|:------:|
| **L0** | Recruit | Two feedback forms; no bug | **10** |
| **L1** | Tester | 1 accepted · App Suite | **20** |
| **L2** | Infra Pioneer | 2 accepted · App Suite + 0G Infra | **40** |
| **L3** | Master | 5+ accepted · incl. 1 systemic | **100** |

L0 is feedback-only: 0G App Suite Feedback / 0G Studio Feedback + 0G Private Computer Feedback. From L1 upward, rewards climb by **accepted, deduped** defects.

> **Acceptance bar:** a defect counts only if it is (a) **reproducible** by someone following your steps, (b) a **divergence from documented/expected behavior** — not market state or your own misconfig, and (c) **measured against the known stack baseline**, not an imagined production target.

## Where to submit

| Module | Bug report | Notes |
|--------|------------|-------|
| **L0 Recruit** | No bug report | Submit 0G App Suite Feedback / 0G Studio Feedback + 0G Private Computer Feedback. |
| **0G App Suite** *(core)* | [Defect report form](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=defect-report.yml&labels=defect) | Filed in this Hub. |
| **0G Infra** *(core)* | [Defect report form](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=defect-report.yml&labels=defect) | Filed in this Hub. |
| **Ecosystem dApps** *(record-only)* | dApp's own form / repo | Hub logs coverage only. |

## Done means T3

This applies to bug work after L0. Recruit itself is done after 0G App Suite Feedback / 0G Studio Feedback + 0G Private Computer Feedback.

- **T1 — Coverage:** every in-scope app has a happy path and at least one error path walked.
- **T2 — Defect filed:** every finding is reproducible and filed through the Defect report form.
- **T3 — Intel routed:** every defect has ownership and reaches `status:routed`.

Per app:

```text
Not started → Happy path OK → Error path in progress → Defect found (filed) → Routed / Closed
```

Per defect:

```text
Triage (status:filed) → Accepted → Routed → Closed
```

Baseline against the known stack state. Do not file against an imagined production target.

## Boundaries

- **No feature requests.** Missing functionality counts only when documentation already promised it.
- **Never touch funds or keys.** For swap, bridge, faucet, and sign flows, stop at the transaction-confirmation screen.
- **Ecosystem dApps are record-only.** Log coverage here; route their bugs to their own channels.
- **House wording:** use "The Blockchain for AI Agents" and "onchain"; avoid legacy names.

## Test targets

Pull URLs from [`README.md` → Test targets](./README.md#test-targets), not from memory.

- **0G App Suite · core L0-L1** — 0G App, Genome, 0G Chat, PandaClaw.
- **0G Infra · core L2** — 0G Hub, 0G Storage Scan, Chain Scan, 0G Code to Coin (0g-cc).
- **Ecosystem dApps · record-only L3** — TradeGPT, Jaine, Oku, AI Arena, CARV, Cygnus Finance, DataHive, Khalani, Merkl.

## Calibration

- **SNR gate:** a round dominated by P3/P4 nits with no reproducible P1/P2 is noise; return to core flows.
- **Aggregate repeated root causes:** use the same `rc:*` code and let triage collapse repeats into one `systemic` finding.

## Defect template

The defect template lives in [`README.md`](./README.md#defect-template) and [`defects/TEMPLATE.md`](./defects/TEMPLATE.md); the [Defect report form](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=defect-report.yml&labels=defect) collects the same fields. Reproducibility and routing are mandatory.
