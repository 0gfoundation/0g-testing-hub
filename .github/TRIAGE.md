# Triage runbook

> For the visual version of both flows, see [`docs/WORKFLOWS.md`](../docs/WORKFLOWS.md).

How a defect moves from intake to routed intel, and how rewards and de-duplication
are decided. Companion to the [root README](../README.md) and the
[defect template](../defects/TEMPLATE.md). There are two flows — the **tester** fills one
structured form; the **maintainer** runs the label → verify → dedup → route pipeline.
Reward export joins each `signup` issue's author (the **GitHub username**) to its defect issue authors.

## Tester flow (submit feedback)

L0 Recruit is survey-only: 0G Studio Survey + 0G Private Computer Survey.
It does **not** use this flow. This section starts when a tester is filing
a bug to climb beyond Recruit.

Testers never touch `defects/*.md`, labels, or the board — the only action is filling one form.

1. **Find a bug** while walking an app's happy path + an error path. Reproduce it first — "felt off" is not a defect.
2. **Open the [Submit Feedback form](./ISSUE_TEMPLATE/submit-feedback.yml)** (`issues/new?template=submit-feedback.yml`) — one bug or piece of feedback per issue.
3. **Fill the four fields**: **Category** (Bug Report / Feature Request / Other) + **Product** (dropdowns), **Details** (what happened, steps to reproduce, expected vs. actual), and optional **Evidence** (screenshots, recordings, links). No severity, ownership, environment breakdown, or root-cause codes — those are maintainer triage work.
4. **Submit.** The issue lands labelled `feedback`. A `Bug Report` is promoted to `defect` + `status:filed` automatically and enters **Triage**; `Feature Request` / `Other` are recorded as feedback and are not reward-eligible. Done — the rest is the maintainer's.

> Reward is decided on **accepted, deduped** core bugs (see below), not on how many you file. Ecosystem dApp findings are useful coverage, but the L1-L3 reward path is App Suite + 0G Infra.

## Maintainer flow (triage → route)

Everything from here down is the maintainer pipeline.

> One-time setup of labels + board: run [`scripts/setup-labels-and-board.sh`](../scripts/setup-labels-and-board.sh).
> It is also the safe backfill path for missed open issues: `feedback` issues the
> workflow missed are promoted by Category (Bug Report → `defect`), existing `status:*`
> labels are preserved, missing statuses get `status:filed`, and multi-status issues
> are flagged with `needs:manual-label`. Board Status is set from the single
> existing `status:*` label when it is unambiguous.
> The live board is [Project #19](https://github.com/orgs/0gfoundation/projects/19).

## Automation (how issues reach the board)

New `feedback` issues are routed by their **Category** by the
[`add-defects-to-board`](./workflows/add-defects-to-board.yml) GitHub Action (it replaces
the UI-only built-in Projects workflows, which have no API): a **Bug Report** is promoted
to `defect` + `status:filed`, gets a first-pass `area:*` derived from **Product** (ecosystem
also gets `coverage-log` and an ecosystem-routing notice), is added to the board, and set to
**Triage**. **Feature Request** gets `feature-request`; **Other** stays plain `feedback` —
neither enters the defect pipeline. No `sev:*` is ever auto-applied: severity is assigned
here, at triage.

It depends on a repo secret **`PROJECT_PAT`** — a token with the `project` + `repo` +
`read:org` scopes, because the default `GITHUB_TOKEN` cannot write an org Projects v2 board.

> **Token rotation:** if `PROJECT_PAT` is revoked or expires, intake routing silently stops
> (new submissions keep only the `feedback` label — off the board and invisible to the
> reward export, so the chain fails closed). To rotate:
> `gh secret set PROJECT_PAT --repo 0gfoundation/0g-testing-hub` with a fresh token, then
> re-run `scripts/setup-labels-and-board.sh` — it promotes missed `feedback` Bug Reports to
> `defect` and backfills them onto the board.
> The script does not downgrade existing `status:accepted` / `status:routed` issues;
> it syncs the Project Status from the existing label.

## State machine → board columns

```
Triage → Accepted → Routed → Closed
```

| Column / status label | Meaning | What triage does |
|---|---|---|
| `status:filed` (**Triage**) | New, unvalidated | Confirm/correct the auto-derived `area:*`, apply one `sev:*`. Try the repro from Details. |
| `status:accepted` (**Accepted**) | Real + reproducible | Confirmed. **This is the state that counts toward rewards.** |
| `status:routed` (**Routed**) | Sent upstream | Owner notified (SDK / docs / config / the product team). |
| `status:closed` (**Closed**) | Resolved, rejected, or duplicate | Closed with a one-line reason. |

Area is **orthogonal** to severity (see [SEVERITY.md](../defects/SEVERITY.md)): a P1 in an
Ecosystem dApp is still valuable coverage outside the core reward ladder; a P3 in 0G Infra still routes upstream.

## Labelling on intake

Severity, root cause, and routing are **maintainer responsibilities** — the tester only
supplies Category, Product, Details, and Evidence.

1. **Area** — exactly one: `area:app-suite` · `area:0g-infra` · `area:ecosystem`. Automation
   derives it from the Product dropdown; confirm or correct it here. The map (kept in
   lockstep with `add-defects-to-board.yml` and `scripts/setup-labels-and-board.sh`):
   - 0G App / Genome / 0G Chat / PandaClaw → `area:app-suite`
   - 0G Hub / 0G Storage Scan / Chain Scan / 0G Code to Coin → `area:0g-infra`
   - TradeGPT / Jaine / Oku / AI Arena / CARV / Cygnus Finance / DataHive / Khalani / Merkl → `area:ecosystem`
   - Product = Other → no auto area; the issue carries `needs:manual-label` — assign by hand.
2. **Severity** — exactly one: `sev:P1`…`sev:P4`, assigned by the maintainer from the
   Details field using the [SEVERITY.md](../defects/SEVERITY.md) rubric. The form no longer
   asks testers for a severity.
3. **Status** — move `status:filed` → `status:accepted` once you reproduce it; otherwise close with a reason.
4. **Root cause** — when defects share an underlying cause, apply an `rc:<CODE>` label
   (create it once: `gh label create 'rc:CHAIN_ID_MISSING' --color ededed -d 'shared root cause'`).
5. **Ecosystem coverage** — keep `area:ecosystem`, add `coverage-log` (automation does both), and do not count it toward the L1-L3 core reward ladder. If the bug is actionable, apply `needs:dapp-report-url` and ask the tester to comment the dApp's own issue / form / support link; clear the label once that link is posted.
6. **Feature Request / Other** — stay out of the defect pipeline entirely (`feature-request` / plain `feedback`); they are never counted toward rewards.

## Routed evidence

Before moving an issue to `status:routed`, add a maintainer comment in this exact shape:

```text
Routed to:
Owner:
Upstream link:
Date:
Notes:
```

`Routed to:` and `Upstream link:` are required. The check script fails any
`status:routed` issue that lacks that structured comment:

```bash
node scripts/check-routed-evidence.mjs --repo 0gfoundation/0g-testing-hub
```

Don't guess the owner from memory — look the product up in
[`data/owners.json`](../data/owners.json) (the per-product upstream owner, notify
channel, and tracker). Keep that file current so routing never depends on who happens
to be on triage. (Those values are still `TBD` — fill them in as owners are confirmed.)

## De-duplication (and the reward rule)

When several issues share an `rc:` code they are **one** finding, not N:

1. Pick the **earliest** issue as the canonical one; add the `systemic` label.
2. Label the rest with the same `rc:` code, then close them as duplicates
   (`status:closed`, comment linking the canonical issue).
3. Route the canonical `systemic` issue upstream once — not per app.

To find what to collapse, run the read-only finder — it lists issues already sharing
an `rc:` code, candidate duplicates (same area + overlapping titles, no `rc:` yet), and
any `rc:` label missing from the registry:

```bash
node scripts/find-duplicate-candidates.mjs --repo 0gfoundation/0g-testing-hub
```

Every `rc:<CODE>` must be registered in [`data/root-causes.json`](../data/root-causes.json)
before use — that's the single source for codes so `CHAIN_ID_MISSING` doesn't drift into
`ChainIdMissing`. Add the code there when you create a new `rc:` label.

**Reward consequence:** a tester is credited for **accepted, deduped** defects, not raw filings.
A cluster of issues sharing one `rc:` code counts as **one** rewardable defect, credited to the
first filer. A round that is all `sev:P4` cosmetics does not meet a tier — this is the README's
signal-to-noise gate, enforced.

## Aggregation queries

These replace the old grep-on-files one-liners (kept for reference in
[`defects/README.md`](../defects/README.md)). `--label` is AND-only; use `--search` for OR/negation.

```bash
# Everything sharing a root cause — the systemic-pattern view
gh issue list --label 'rc:CHAIN_ID_MISSING' --state all

# Unrouted blockers (P1) — the signal-positive backlog
gh issue list --search 'label:"sev:P1" -label:"status:routed" state:open'

# Accepted-but-not-yet-routed across P1+P2
gh issue list --search 'label:"status:accepted" -label:"status:routed"'

# All App Suite defects, any severity
gh issue list --label 'area:app-suite' --label 'defect' --state all

# Confirmed systemic findings
gh issue list --label 'systemic' --state all
```

## Reward export

Reward export reads the `signup` issues directly — the issue author is the GitHub
username (the join key) and the wallet is in the issue body — carries the wallet into
the output, credits L0 from the `l0:cleared` label, then counts **accepted + deduped**
App Suite / 0G Infra findings:

```bash
node scripts/export-reward-report.mjs --signups-from-issues --format csv --out rewards.csv
```

Add `--strict` to block payout on unmatched authors, duplicate usernames, duplicate
wallets (Sybil), or rewardable users missing a wallet. (A legacy `--signups <csv>` /
`--l0 <csv>` path remains for non-GitHub data; schema in
[`docs/signups.example.csv`](../docs/signups.example.csv).)

Rules enforced by the script:

- `status:accepted` and `status:routed` are rewardable states.
- `area:ecosystem` coverage logs are excluded from reward counts.
- Issues sharing one `rc:<CODE>` collapse to the earliest canonical issue and credit the first filer.
- L3 requires 5+ accepted, deduped core findings, including the L2 App Suite + 0G Infra spread.

## Migrating the old intake (Issue #3)

[Issue #3](https://github.com/0gfoundation/0g-testing-hub/issues/3) was the free-text bug thread.
Pin a final comment pointing to the new form, re-file any still-open comments as form issues,
then close #3. (Maintainer action — not automated.)

## Who does what

| Step | Tester | Maintainer |
|---|---|---|
| Intake | Picks Category + Product, writes Details / Evidence → Bug Reports auto-promoted to `defect` (Triage) | — |
| Classify | — | Automation derives first-pass `area:*` from Product; maintainer corrects it and applies `sev:*` |
| Verify | — | `status:accepted` if reproducible, else close with a reason |
| Dedup | — | `rc:`/`systemic` labels; collapse duplicates to one |
| Route | — | Add routed evidence comment, then `status:routed`, send upstream once |
| Reward | Supplies GitHub username + wallet through signup | Runs `scripts/export-reward-report.mjs`; counts **accepted + deduped** defects per GitHub username and exports wallet |
