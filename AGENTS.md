# 0g-testing-hub

This is the canonical AI agent instruction file for this repository. It mirrors [`README.md`](./README.md); treat the README as the participant-facing source of truth for goals, levels, flows, test targets, submission rules, and defect template.

**Not a code project.** `0g-testing-hub` is a community-run testing program for 0G: submit the required feedback, test target apps, file reproducible bugs, and climb **L0-L3** for 0G Compute Credit. There is no build, no tests, no lint, and no package manager here. The deliverable is **required feedback plus reproducible, routable defect intel**, not source code.

If a task drifts toward "write a script / set up a harness / refactor something here," stop and re-read the README. The work product is filed defects and feedback, not application code.

## Quick start

1. **Register once.**
2. **Clear L0** with feedback only; no bug required.
3. **Climb from L1** with accepted, reproducible bugs.
4. **Cover in order:** App Suite -> 0G Infra -> Ecosystem dApps (record-only).

All live links stay in **How to get reward**.

## How to get reward

| Need | Link |
|------|------|
| **Sign up** (testing intake) | https://forms.gle/Mhm8YKXL9Kbvt11S8 |
| **0G Studio Feedback** | https://forms.gle/ymEdZrdTNs4giEm1A |
| **0G Private Computer Feedback** | https://forms.gle/G919xrbRyfVJxPZe8 |
| **Submit a bug / coverage log** | [Defect report form](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=defect-report.yml&labels=defect,status:filed) |
| **Track issues** | [Defect board #19](https://github.com/orgs/0gfoundation/projects/19) |
| **Level rules · rewards** | [`LEVELS.md`](./LEVELS.md) · [`rewards.md`](./seasons/2026-apac/rewards.md) |
| **Workflow diagram** (tester + maintainer) | [`docs/WORKFLOWS.md`](./docs/WORKFLOWS.md) |
| **Signup export schema** | [`docs/signups.example.csv`](./docs/signups.example.csv) |

```json
{
  "signup": "https://forms.gle/Mhm8YKXL9Kbvt11S8",
  "appSuiteFeedback": "https://forms.gle/ymEdZrdTNs4giEm1A",
  "privateComputerFeedback": "https://forms.gle/G919xrbRyfVJxPZe8",
  "testingRepo": "https://github.com/0gfoundation/0g-testing-hub",
  "bugReport": "https://github.com/0gfoundation/0g-testing-hub/issues/new?template=defect-report.yml&labels=defect,status:filed",
  "signupSchema": "docs/signups.example.csv"
}
```

## Data chain

The reward system depends on this chain. Do not bypass it:

1. **Signup form** collects the tester's 0G mainnet EVM wallet and **GitHub username**. This external form is the prerequisite for reliable rewards; the GitHub username is the identity join key and the wallet is the payout destination.
2. **Defect report / coverage log form** creates GitHub issues labelled `defect` + `status:filed`.
3. **Workflow** adds every `defect` issue to Project #19, derives `area:*` / `sev:*` / `coverage-log` labels from the form body, and keeps the board's Triage state aligned with `status:filed`. If the form body can't be parsed, it applies `needs:manual-label` so the gap is visible instead of silently shipping unlabelled.
4. **Triage** moves issues through `status:accepted` and `status:routed`, applies one `area:*`, one `sev:*`, optional `rc:*`, and `systemic` when appropriate.
5. **Route evidence** is required before `status:routed`: add a comment containing `Routed to:` and `Upstream link:`. Look up the upstream owner in [`data/owners.json`](./data/owners.json) so routing doesn't depend on tribal knowledge.
6. **Reward export** runs `node scripts/export-reward-report.mjs --signups <signup-export.csv> --format csv --out rewards.csv` and joins signup GitHub usernames to GitHub issue authors; output includes wallet. Add `--l0 <l0-export.csv>` to fold L0 feedback completion into the same report (L0-L3 in one pass), and `--strict` to fail before payout on unmatched issue authors, duplicate signup usernames, or rewardable users missing a wallet.

Implemented chain:

1. Signup form with GitHub username + wallet fields. This is the external prerequisite and must exist before reliable rewards.
2. Ecosystem classification: form treats Ecosystem as **coverage-log** and uses `Reported to dApp URL` for actionable bugs.
3. `status:filed` + `area:*` + `sev:*` automation: form labels plus workflow/backfill.
4. Reward export script: depends on signup usernames, wallet, and the status label chain.
5. Routed-to evidence: `status:routed` requires a structured maintainer comment.
6. Targets generator and per-target checklists: `data/targets.json` renders README's generated target block.

Routed evidence check:

```bash
node scripts/check-routed-evidence.mjs --repo 0gfoundation/0g-testing-hub
```

**A bug is accepted only if it is** (a) **reproducible** from your steps, (b) a **divergence from documented/expected behavior** - not market state or your own misconfig, and (c) **measured against the current stack baseline**, not an imagined production target. Duplicates collapse to the first reporter via shared `rc:` root-cause codes — register every code in [`data/root-causes.json`](./data/root-causes.json), and run `node scripts/find-duplicate-candidates.mjs` to surface clusters to collapse.

**Won't be accepted / out of bounds:**

- **Duplicates** or **not-reproducible** "felt off" reports.
- **Feature requests** - unless the docs already promised the behavior.
- **P4 cosmetics** with no reproducible P1/P2.
- **Record-only dApp bugs** - route to the dApp's own channel; the Hub only logs coverage. If an Ecosystem coverage log contains an actionable bug, require `Reported to dApp URL`.
- **Funds / keys** - never sign or send; stop at the transaction-confirmation screen on swap / bridge / faucet / sign flows.

## Levels & rewards

All rewards are **0G Compute Credit** - no physical goods, no shipping. Payout = the Credit of the **highest level reached**.

| Lv | Title | How it clears | Credit |
|----|-------|---------------|:------:|
| **L0** | Recruit | Two feedback forms; no bug | **10** |
| **L1** | Tester | 1 accepted · App Suite | **20** |
| **L2** | Infra Pioneer | 2 accepted · App Suite + 0G Infra | **40** |
| **L3** | Master | 5+ accepted · incl. 1 `systemic` | **100** |

The more **accepted, deduped** defects a tester surfaces, the higher they climb. Ecosystem dApps are **record-only**: log coverage, but do not treat their bugs as reward gates.

## Test targets

`data/targets.json` is the source of truth for target URLs, descriptions, and checklists. Do not hand-edit README's generated target block. Edit `data/targets.json`, then run:

```bash
node scripts/render-targets-readme.mjs --write
node scripts/check-targets-drift.mjs
```

- **0G App Suite · core (L0-L1)** - 0G App, Genome, 0G Chat, PandaClaw.
- **0G Infra · core (L2)** - 0G Hub, 0G Storage Scan, Chain Scan, 0G Code to Coin (0g-cc).
- **Ecosystem dApps · record-only** - TradeGPT, Jaine, Oku, AI Arena, CARV, Cygnus Finance, DataHive, Khalani, Merkl.

## Defect template

The [Defect report form](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=defect-report.yml&labels=defect,status:filed) collects these fields. The same structure lives in [`README.md`](./README.md#defect-template), [`defects/TEMPLATE.md`](./defects/TEMPLATE.md), and [`defects/SEVERITY.md`](./defects/SEVERITY.md).

```text
Title:
Ownership: App Suite | 0G Infra | Ecosystem dApps (which product)
Severity: P1 / P2 / P3 / P4
Environment: browser / wallet / Chain ID / network
Repro steps: 1. 2. 3. ...
Expected / Actual result:
Screenshot/recording:
Reported to dApp URL (Ecosystem only):
Root-cause guess (optional):
```
