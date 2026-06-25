# 0g-testing-hub

This is the canonical AI agent instruction file for this repository. It is the fuller companion to the participant-facing [`README.md`](./README.md): the README stays the source of truth for goals, levels, flows, and test targets, while this file adds the operational detail agents need — the data chain, acceptance criteria, dedup/routing, and reward export. Where both cover the same fact, keep them in sync.

**Not a code project.** `0g-testing-hub` is a testing program for 0G Ecosystem: submit the required feedback, test target apps, file reproducible bugs, and climb **L0-L3** for 0G Compute Credit. There is no build, no tests, no lint, and no package manager here. The deliverable is **required feedback plus reproducible, routable defect intel**, not source code.

If a task drifts toward "write a script / set up a harness / refactor something here," stop and re-read the README. The work product is filed defects and feedback, not application code.

## Test, Report, Reward

All rewards are **0G Compute Credit**; payout = the Credit of the **highest level reached** (not cumulative).

| Step | Reach | How it clears | Where to go | Credit |
|------|-------|---------------|-------------|:------:|
| **0** | **Sign Up** | Open a sign-up issue with your 0G mainnet wallet (your GitHub account is your identity) | [Sign up (GitHub)](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=signup.yml&labels=signup) | — |
| **1** | **L0** Recruit | 2 feedback forms; no bug required | 1. [0G Studio Feedback (App Suite, all four apps)](https://forms.gle/ymEdZrdTNs4giEm1A)<br>2. [0G Private Computer Feedback](https://forms.gle/G919xrbRyfVJxPZe8) | **10 0G Compute Credit** |
| **2** | **L1** Tester | 1 accepted · App Suite | [Defect report form](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=defect-report.yml&labels=defect,status:filed) | **20 0G Compute Credit** |
| **3** | **L2** Infra Pioneer | +1 accepted · 0G Infra (2 total) | [Defect report form](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=defect-report.yml&labels=defect,status:filed) | **40 0G Compute Credit** |
| **4** | **L3** Master | 5+ accepted · incl. 1 `systemic` | [Defect report form](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=defect-report.yml&labels=defect,status:filed) | **100 0G Compute Credit** |

Track filed issues on the [Defect board #19](https://github.com/orgs/0gfoundation/projects/19). The more **accepted, deduped** defects a tester surfaces, the higher they climb - Master is the cap. Ecosystem dApps are **record-only**: log coverage, not a reward gate.

Two GitHub issue forms drive the program: **`signup.yml`** (label `signup` — step 0, identity + wallet + personal tracker, handled by `confirm-signup.yml`) and **`defect-report.yml`** (labels `defect` + `status:filed` — steps 2–4, one bug/coverage log per issue, handled by `add-defects-to-board.yml` + `notify-status-change.yml`). Step 1's L0 feedback is two external Google forms (see `config.yml` contact links), not GitHub issues.

```json
{
  "signup": "https://github.com/0gfoundation/0g-testing-hub/issues/new?template=signup.yml&labels=signup",
  "appSuiteFeedback": "https://forms.gle/ymEdZrdTNs4giEm1A",
  "privateComputerFeedback": "https://forms.gle/G919xrbRyfVJxPZe8",
  "testingRepo": "https://github.com/0gfoundation/0g-testing-hub",
  "bugReport": "https://github.com/0gfoundation/0g-testing-hub/issues/new?template=defect-report.yml&labels=defect,status:filed",
  "defectBoard": "https://github.com/orgs/0gfoundation/projects/19",
  "levelRules": "LEVELS.md",
  "rewards": "README.md#test-report-reward",
  "workflowDiagram": "docs/WORKFLOWS.md",
  "signupSchema": "docs/signups.example.csv"
}
```

## Data chain

The reward system depends on this chain. Do not bypass it:

1. **Sign-up issue** (`signup.yml`, labelled `signup`) registers the tester. The **issue author** is the authenticated **GitHub username** — the identity join key, captured automatically so it can't be mistyped — and the **0G mainnet EVM wallet** is recorded in the issue body (public). `confirm-signup.yml` validates the wallet, normalizes the title to `[signup]: <author>`, and comments the L0 next steps. Reward export reads these signup issues via `--signups-from-issues`, so no external signup form is needed.
2. **L0 feedback bridge** — the two external Google feedback forms each run an Apps Script (`automation/l0-feedback-bridge.gs`) that labels the tester's sign-up issue `l0:studio-done` / `l0:pc-done` by GitHub username; `mark-l0-cleared.yml` comments partial progress when only one form has arrived, then sets `l0:cleared` and points the tester toward L1 once both arrive. See [`automation/README.md`](./automation/README.md).
3. **Defect report / coverage log form** creates GitHub issues labelled `defect` + `status:filed`.
4. **Workflow** adds every `defect` issue to Project #19, derives `area:*` / `sev:*` / `coverage-log` labels from the form body, and keeps the board's Triage state aligned with `status:filed`. If the form body can't be parsed, it applies `needs:manual-label` so the gap is visible instead of silently shipping unlabelled.
5. **Triage** moves issues through `status:accepted` and `status:routed`, applies one `area:*`, one `sev:*`, optional `rc:*`, and `systemic` when appropriate.
6. **Route evidence** is required before `status:routed`: add a comment containing `Routed to:` and `Upstream link:`. Look up the upstream owner in [`data/owners.json`](./data/owners.json) so routing doesn't depend on tribal knowledge.
7. **Reward preview + export** — `notify-status-change.yml` comments an advisory reward progress preview on the tester's signup issue when rewardable core defects reach `status:accepted` / `status:routed`; final payout still comes from `node scripts/export-reward-report.mjs --signups-from-issues --format csv --out rewards.csv`. The export reads `signup` issues directly (author = GitHub username, body = wallet), counts accepted + deduped App Suite / 0G Infra defects, and credits L0 from the `l0:cleared` label. `--strict` blocks payout on unmatched issue authors, duplicate signup usernames, **duplicate wallets (Sybil)**, or rewardable users missing a wallet. (A legacy `--signups <csv>` / `--l0 <csv>` path remains for non-GitHub data.)

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

## Test Targets

`data/targets.json` is the source of truth for target URLs, descriptions, and per-target checklists. Do not hand-edit README's generated target block. Edit `data/targets.json`, then run:

```bash
node scripts/render-targets-readme.mjs --write
node scripts/check-targets-drift.mjs
```

- **0G App Suite · core (L0-L1)** - 0G App, Genome, 0G Chat, PandaClaw.
- **0G Infra · core (L2)** - 0G Hub, 0G Storage Scan, Chain Scan, 0G Code to Coin (0g-cc).
- **0G Ecosystem dApp** - TradeGPT, Jaine, Oku, AI Arena, CARV, Cygnus Finance, DataHive, Khalani, Merkl.

## Defect template

The [Defect report form](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=defect-report.yml&labels=defect,status:filed) collects these fields. The same structure lives in [`defects/TEMPLATE.md`](./defects/TEMPLATE.md) and [`defects/SEVERITY.md`](./defects/SEVERITY.md).

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
