# Triage runbook

How a defect moves from intake to routed intel, and how rewards and de-duplication
are decided. Companion to the [root README](../README.md) and the
[defect template](../defects/TEMPLATE.md). There are two flows — the **tester** fills one
structured form; the **maintainer** runs the label → verify → dedup → route pipeline.

## Tester flow (file a defect)

L0 Recruit is feedback-only: 0G App Suite Feedback / 0G Studio Feedback +
0G Private Computer Feedback.
It does **not** use this defect flow. This section starts when a tester is filing
a bug to climb beyond Recruit.

Testers never touch `defects/*.md`, labels, or the board — the only action is filling one form.

1. **Find a defect** while walking an app's happy path + an error path. Reproduce it first — "felt off" is not a defect.
2. **Open the [Defect report form](./ISSUE_TEMPLATE/defect-report.yml)** (`issues/new?template=defect-report.yml&labels=defect`) — one issue per defect.
3. **Fill the fields**: ownership + severity (dropdowns), product, environment, repro / expected / actual; optionally a root-cause guess and an `rc:` **root-cause code** if you suspect it's shared with another bug.
4. **Tick the three gates**: reproduced it yourself · didn't sign/touch funds or keys · understand Ecosystem dApps are record-only.
5. **Submit.** The issue is auto-labelled `defect` and lands in **Triage**. Done — the rest is the maintainer's.

> Reward is decided on **accepted, deduped** defects (see below), not on how many you file.

## Maintainer flow (triage → route)

Everything from here down is the maintainer pipeline.

> One-time setup of labels + board: run [`scripts/setup-labels-and-board.sh`](../scripts/setup-labels-and-board.sh).
> The live board is [Project #19](https://github.com/orgs/0gfoundation/projects/19).

## Automation (how issues reach the board)

New `defect` issues are added to the board and set to **Triage** automatically by the
[`add-defects-to-board`](./workflows/add-defects-to-board.yml) GitHub Action (it replaces
the UI-only built-in Projects workflows, which have no API).

It depends on a repo secret **`PROJECT_PAT`** — a token with the `project` + `repo` +
`read:org` scopes, because the default `GITHUB_TOKEN` cannot write an org Projects v2 board.

> **Token rotation:** if `PROJECT_PAT` is revoked or expires, auto-add silently stops
> (issues still get the `defect` label, they just won't appear on the board). To rotate:
> `gh secret set PROJECT_PAT --repo 0gfoundation/0g-testing-hub` with a fresh token, then
> back-fill any missed issues by re-running `scripts/setup-labels-and-board.sh`.

## State machine → board columns

```
Triage → Accepted → Routed → Closed
```

| Column / status label | Meaning | What triage does |
|---|---|---|
| `status:filed` (**Triage**) | New, unvalidated | Apply one `area:*` and one `sev:*` label. Try the repro. |
| `status:accepted` (**Accepted**) | Real + reproducible | Confirmed. **This is the state that counts toward rewards.** |
| `status:routed` (**Routed**) | Sent upstream | Owner notified (SDK / docs / config / the product team). |
| `status:closed` (**Closed**) | Resolved, rejected, or duplicate | Closed with a one-line reason. |

Ownership is **orthogonal** to severity (see [SEVERITY.md](../defects/SEVERITY.md)): a P1 in an
Ecosystem dApp is still record-only; a P3 in 0G Infra still routes upstream.

## Labelling on intake

1. **Area** — exactly one: `area:app-suite` · `area:0g-infra` · `area:ecosystem`.
2. **Severity** — exactly one: `sev:P1`…`sev:P4`. If the filer over/under-rated it, fix it here.
3. **Status** — move `status:filed` → `status:accepted` once you reproduce it; otherwise close with a reason.
4. **Root cause** — if the issue names a root-cause code, apply an `rc:<CODE>` label
   (create it once: `gh label create 'rc:CHAIN_ID_MISSING' --color ededed -d 'shared root cause'`).

## De-duplication (and the reward rule)

When several issues share an `rc:` code they are **one** finding, not N:

1. Pick the **earliest** issue as the canonical one; add the `systemic` label.
2. Label the rest with the same `rc:` code, then close them as duplicates
   (`status:closed`, comment linking the canonical issue).
3. Route the canonical `systemic` issue upstream once — not per app.

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

## Migrating the old intake (Issue #3)

[Issue #3](https://github.com/0gfoundation/0g-testing-hub/issues/3) was the free-text bug thread.
Pin a final comment pointing to the new form, re-file any still-open comments as form issues,
then close #3. (Maintainer action — not automated.)

## Who does what

| Step | Tester | Maintainer |
|---|---|---|
| Intake | Fills the form → issue auto-labelled `defect` (Triage) | — |
| Classify | — | One `area:*` + one `sev:*` |
| Verify | — | `status:accepted` if reproducible, else close with a reason |
| Dedup | (optional) suggests an `rc:` code | `rc:`/`systemic` labels; collapse duplicates to one |
| Route | — | `status:routed`, send upstream once |
| Reward | Submits tier reward form | Counts **accepted + deduped** defects per filer |
