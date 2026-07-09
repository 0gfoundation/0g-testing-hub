# 0g-testing-hub

This is the canonical AI agent instruction file for this repository. It is the fuller companion to the participant-facing [`README.md`](./README.md): the README stays the source of truth for goals, levels, flows, and test targets, while this file adds the operational detail agents need — the data chain, acceptance criteria, dedup/routing, and reward export. Where both cover the same fact, keep them in sync.

**Not a code project.** `0g-testing-hub` is a testing program for 0G Ecosystem: complete the required L0 surveys, test target apps, file reproducible bugs through Submit Feedback, and climb **L0-L3** for 0G Compute Credit. There is no build, no tests, no lint, and no package manager here. The deliverable is **required surveys plus reproducible, routable defect intel**, not source code.

If a task drifts toward "write a script / set up a harness / refactor something here," stop and re-read the README. The work product is filed defects and feedback, not application code.

## Test, Report, Reward

All rewards are **0G Compute Credit**; payout = the Credit of the **highest level reached** (not cumulative).

| Reach | How it clears | Where to go | Credit |
|-------|---------------|-------------|:------:|
| **Sign Up** | Register with your 0G mainnet wallet (your GitHub account is your identity) | [Sign up (GitHub)](https://github.com/0gfoundation/0g-testing-hub/issues/new?title=%5Bsignup%5D%3A%20tester%20registration&labels=signup&body=%23%23%23%200G%20mainnet%20EVM%20wallet%20address%0A%0AReplace%20this%20line%20with%20your%20public%200x%20wallet%20address.%20Never%20paste%20a%20private%20key%20or%20seed%20phrase.%0A%0A---%0A%0A%2A%2AThis%20issue%20is%20your%20one-time%20registration%20and%20permanent%20reward%20tracker.%2A%2A%20Leave%20the%20title%20as%20is%20%E2%80%94%20a%20bot%20renames%20it%20to%20your%20GitHub%20username.%20After%20you%20submit%2C%20the%20bot%20validates%20your%20wallet%20and%20comments%20your%20next%20step%20here%3B%20labels%20on%20this%20issue%20show%20your%20progress.%0A%0A%23%23%23%20Your%20path%20%E2%80%94%20tick%20each%20box%20as%20you%20go%0A%0A-%20%5B%20%5D%20Replace%20the%20placeholder%20above%20with%20my%20public%200x%20wallet%2C%20then%20press%20%2A%2ASubmit%20new%20issue%2A%2A%0A-%20%5B%20%5D%20Bot%20confirmed%20my%20wallet%20%28if%20it%20flags%20%60signup%3Aneeds-fix%60%2C%20edit%20this%20issue%20to%20fix%20it%29%0A-%20%5B%20%5D%20Completed%20the%20%5B0G%20Studio%20Survey%5D%28https%3A%2F%2Fforms.gle%2FymEdZrdTNs4giEm1A%29%0A-%20%5B%20%5D%20Completed%20the%20%5B0G%20Private%20Computer%20Survey%5D%28https%3A%2F%2Fforms.gle%2FG919xrbRyfVJxPZe8%29%0A-%20%5B%20%5D%20%60l0%3Acleared%60%20label%20appeared%20%E2%86%92%20%2A%2AL0%20done%2C%2010%20Credit%2A%2A%0A-%20%5B%20%5D%20Filed%20my%20first%20reproducible%20App%20Suite%20bug%20via%20%5BSubmit%20Feedback%5D%28https%3A%2F%2Fgithub.com%2F0gfoundation%2F0g-testing-hub%2Fissues%2Fnew%3Ftemplate%3Dsubmit-feedback.yml%29%20%E2%86%92%20%2A%2AL1%20when%20accepted%2C%2020%20Credit%2A%2A) | — |
| **L0** Recruit | 2 required surveys; no bug required | 1. [0G Studio Survey (App Suite, all four apps)](https://forms.gle/ymEdZrdTNs4giEm1A)<br>2. [0G Private Computer Survey](https://forms.gle/G919xrbRyfVJxPZe8) | **10 0G Compute Credit** |
| **L1** Tester | 1 accepted · App Suite | [Submit Feedback form](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=submit-feedback.yml) | **20 0G Compute Credit** |
| **L2** Infra Pioneer | +1 accepted · 0G Infra (2 total) | [Submit Feedback form](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=submit-feedback.yml) | **40 0G Compute Credit** |
| **L3** Master | 5+ accepted · App Suite + 0G Infra | [Submit Feedback form](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=submit-feedback.yml) | **100 0G Compute Credit** |

Track filed issues on the [Defect board #19](https://github.com/orgs/0gfoundation/projects/19). The more **accepted, deduped** core defects a tester surfaces, the higher they climb - Master is the cap. 0G App Suite and 0G Infra are the L1-L3 reward path; Ecosystem dApps are useful ecosystem coverage, not a core reward gate.

One GitHub issue form is exposed in the chooser: **`submit-feedback.yml`** (label `feedback` — one bug or piece of feedback per issue; `add-defects-to-board.yml` routes it by Category, and Bug Reports promoted to `defect` climb L1–L3 via `notify-status-change.yml`). Sign-up stays README-only: the registration link creates a `signup` issue used for identity, wallet, and the personal tracker, handled by `confirm-signup.yml`. L0 is two external Google surveys (see `config.yml` contact links), not GitHub feedback issues.

```json
{
  "signup": "https://github.com/0gfoundation/0g-testing-hub/issues/new?title=%5Bsignup%5D%3A%20tester%20registration&labels=signup&body=%23%23%23%200G%20mainnet%20EVM%20wallet%20address%0A%0AReplace%20this%20line%20with%20your%20public%200x%20wallet%20address.%20Never%20paste%20a%20private%20key%20or%20seed%20phrase.%0A%0A---%0A%0A%2A%2AThis%20issue%20is%20your%20one-time%20registration%20and%20permanent%20reward%20tracker.%2A%2A%20Leave%20the%20title%20as%20is%20%E2%80%94%20a%20bot%20renames%20it%20to%20your%20GitHub%20username.%20After%20you%20submit%2C%20the%20bot%20validates%20your%20wallet%20and%20comments%20your%20next%20step%20here%3B%20labels%20on%20this%20issue%20show%20your%20progress.%0A%0A%23%23%23%20Your%20path%20%E2%80%94%20tick%20each%20box%20as%20you%20go%0A%0A-%20%5B%20%5D%20Replace%20the%20placeholder%20above%20with%20my%20public%200x%20wallet%2C%20then%20press%20%2A%2ASubmit%20new%20issue%2A%2A%0A-%20%5B%20%5D%20Bot%20confirmed%20my%20wallet%20%28if%20it%20flags%20%60signup%3Aneeds-fix%60%2C%20edit%20this%20issue%20to%20fix%20it%29%0A-%20%5B%20%5D%20Completed%20the%20%5B0G%20Studio%20Survey%5D%28https%3A%2F%2Fforms.gle%2FymEdZrdTNs4giEm1A%29%0A-%20%5B%20%5D%20Completed%20the%20%5B0G%20Private%20Computer%20Survey%5D%28https%3A%2F%2Fforms.gle%2FG919xrbRyfVJxPZe8%29%0A-%20%5B%20%5D%20%60l0%3Acleared%60%20label%20appeared%20%E2%86%92%20%2A%2AL0%20done%2C%2010%20Credit%2A%2A%0A-%20%5B%20%5D%20Filed%20my%20first%20reproducible%20App%20Suite%20bug%20via%20%5BSubmit%20Feedback%5D%28https%3A%2F%2Fgithub.com%2F0gfoundation%2F0g-testing-hub%2Fissues%2Fnew%3Ftemplate%3Dsubmit-feedback.yml%29%20%E2%86%92%20%2A%2AL1%20when%20accepted%2C%2020%20Credit%2A%2A",
  "appSuiteSurvey": "https://forms.gle/ymEdZrdTNs4giEm1A",
  "privateComputerSurvey": "https://forms.gle/G919xrbRyfVJxPZe8",
  "testingRepo": "https://github.com/0gfoundation/0g-testing-hub",
  "bugReport": "https://github.com/0gfoundation/0g-testing-hub/issues/new?template=submit-feedback.yml",
  "defectBoard": "https://github.com/orgs/0gfoundation/projects/19",
  "levelRules": "docs/LEVELS.md",
  "rewards": "README.md#test-report-reward",
  "rewardPreflight": "docs/REWARD_PREFLIGHT.md",
  "workflowDiagram": "docs/WORKFLOWS.md",
  "signupSchema": "docs/signups.example.csv"
}
```

## Data chain

The reward system depends on this chain. Do not bypass it:

1. **Sign-up issue** (created from the README registration link and labelled `signup`) registers the tester. The **issue author** is the authenticated **GitHub username** — the identity join key, captured automatically so it can't be mistyped — and the **0G mainnet EVM wallet** is recorded in the issue body (public). `confirm-signup.yml` validates the wallet, normalizes the title to `[signup]: <author>`, and comments the L0 next steps. Reward export reads these signup issues via `--signups-from-issues`, so no external signup form is needed.
2. **L0 survey bridge** — the two external Google surveys each run an Apps Script (`automation/l0-feedback-bridge.gs`) that labels the tester's sign-up issue `l0:studio-done` / `l0:pc-done` by GitHub username; `mark-l0-cleared.yml` comments partial progress when only one survey has arrived, then sets `l0:cleared` and points the tester toward L1 once both arrive. See [`automation/README.md`](./automation/README.md).
3. **Submit Feedback form** creates GitHub issues labelled `feedback`, with four tester fields: **Category** (Bug Report / Feature Request / Other), **Product**, **Details**, **Evidence**.
4. **Workflow** (`add-defects-to-board.yml`) routes each `feedback` issue by Category: **Bug Report** is promoted to `defect` + `status:filed`, gets an `area:*` and a `product:*` derived from Product (map below; ecosystem also gets `coverage-log` and an ecosystem-routing notice), and lands on Project #19 in Triage. **Feature Request** gets `feature-request`; **Other** stays plain `feedback` — neither ever enters the defect pipeline or reward export. `sev:*` is never auto-applied. If no area can be derived (Product = Other, or an unparseable body), it applies `needs:manual-label` so the gap is visible instead of silently shipping unlabelled.
5. **Triage** moves issues through `status:accepted` and `status:routed`, with `status:needs-info` when the repro needs tester input; a close carries exactly one `resolution:*` (`fixed` keeps reward credit, `rejected`/`duplicate` do not). The maintainer confirms/corrects the `area:*`/`product:*`, applies one `sev:*`, optional `rc:*`, and `systemic` when appropriate — severity, routing, dedup, and reward eligibility are maintainer calls, never tester input.
6. **Route evidence** is required before `status:routed`: add a comment containing `Routed to:` and `Upstream link:`. Look up the upstream owner in [`data/owners.json`](./data/owners.json) so routing doesn't depend on tribal knowledge.
7. **Reward preview + export** — `notify-status-change.yml` comments an advisory reward progress preview on the tester's signup issue when rewardable core defects reach `status:accepted` / `status:routed`; final payout still comes from `node scripts/export-reward-report.mjs --signups-from-issues --format csv --out rewards.csv`. Before payout, run the same export with `--blockers-out rewards.blockers.json --audit-out rewards.audit.json --strict` (see [`docs/REWARD_PREFLIGHT.md`](./docs/REWARD_PREFLIGHT.md)) so structured blockers are visible. The export reads `signup` issues directly (author = GitHub username, body = wallet), counts accepted + deduped App Suite / 0G Infra defects, and credits L0 from the `l0:cleared` label. `--strict` blocks payout on unmatched issue authors, duplicate signup usernames, **duplicate wallets (Sybil)**, or rewardable users missing a wallet; lightweight accepted-issue quality gaps are warnings for maintainer cleanup. (A legacy `--signups <csv>` / `--l0 <csv>` path remains for non-GitHub data.)

Routed evidence check:

```bash
node scripts/check-routed-evidence.mjs --repo 0gfoundation/0g-testing-hub
```

**A bug is accepted only if it is** (a) **reproducible** from your steps, (b) a **divergence from documented/expected behavior** - not market state or your own misconfig, and (c) **measured against the current stack baseline**, not an imagined production target. Duplicates collapse to the first reporter via shared `rc:` root-cause codes — register every code in [`data/root-causes.json`](./data/root-causes.json), and run `node scripts/find-duplicate-candidates.mjs` to surface clusters to collapse.

**Won't be accepted / out of bounds:**

- **Duplicates** or **not-reproducible** "felt off" reports.
- **Feature requests** - recorded under Category `Feature Request`, never rewarded (unless the docs already promised the behavior — then it's a bug).
- **P4 cosmetics** with no reproducible P1/P2.
- **Ecosystem dApp findings** - useful as ecosystem coverage, but not part of the L1-L3 core reward ladder. If an Ecosystem bug is actionable, ask the tester to comment the dApp's own report link (`needs:dapp-report-url` is maintainer-applied at triage).
- **Funds / keys** - never sign or send; stop at the transaction-confirmation screen on swap / bridge / faucet / sign flows.

## Test Targets

`data/targets.json` is the source of truth for target URLs, descriptions, and target notes. Do not hand-edit README's generated target block. Edit `data/targets.json`, then run:

```bash
node scripts/render-targets-readme.mjs --write
node scripts/check-targets-drift.mjs
```

- **0G App Suite · core (L0-L1)** - 0G App, Genome, 0G Chat, PandaClaw.
- **0G Infra · core (L2)** - 0G Hub, 0G Storage Scan, Chain Scan, 0G Code to Coin (0g-cc).
- **0G Ecosystem dApp** - TradeGPT, Jaine, Oku, AI Arena, CARV, Cygnus Finance, DataHive, Khalani, Merkl.

## Submit Feedback form

The [Submit Feedback form](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=submit-feedback.yml) collects exactly four tester fields — everything else (area, severity, root cause, routing) is maintainer triage work. The same structure lives in [`defects/TEMPLATE.md`](./defects/TEMPLATE.md); the maintainer severity rubric is [`defects/SEVERITY.md`](./defects/SEVERITY.md).

```text
Category: Bug Report | Feature Request | Other
Product:  one of the listed targets, or Other
Details:  what happened / steps to reproduce / expected / actual
Evidence: screenshots, recordings, links, extra context (optional)
```

Product → area mapping (applied by automation, corrected by maintainers; keep in lockstep with `add-defects-to-board.yml` and `scripts/setup-labels-and-board.sh`; every listed product also gets its own `product:*` label from `.github/labels.yml`, e.g. `product:0g-chat`):

| Product | Area label |
|---|---|
| 0G App / Genome / 0G Chat / PandaClaw | `area:app-suite` |
| 0G Hub / 0G Storage Scan / Chain Scan / 0G Code to Coin | `area:0g-infra` |
| TradeGPT / Jaine / Oku / AI Arena / CARV / Cygnus Finance / DataHive / Khalani / Merkl | `area:ecosystem` (+ `coverage-log`, outside core rewards) |
| Other | none — `needs:manual-label`, maintainer assigns at triage |

At triage the maintainer adds what the form no longer asks for: one `sev:*`, the `status:*` transitions, and `rc:*` when defects share a root cause. `Feature Request` / `Other` submissions never enter reward statistics; `Bug Report` counts only after it is accepted and deduped.
