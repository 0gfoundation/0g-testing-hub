# Label guide — read your issue like a dashboard

Every label in this repo is defined in [`.github/labels.yml`](../.github/labels.yml)
(the source of record) and applied either by automation or by a maintainer at triage —
**never by testers**. This page explains what each label means from both sides of the
table: what a tester should read from it, and what a maintainer promises by applying it.

A label change alone sends no GitHub notification, so
[`notify-status-change.yml`](../.github/workflows/notify-status-change.yml) posts a
comment on your issue at every meaningful transition — you get notified, and the
comment spells out what the change means for your reward.

## For testers — the life of your bug report

You fill one form (Category, Product, Details, Evidence). From then on, labels tell
the story:

```
feedback → defect + status:filed → status:accepted → status:routed
                    ↓ ↑                     ↓
             status:needs-info       status:closed + resolution:*
```

| You see | It means | Do you need to act? |
|---|---|---|
| `feedback` | Your submission arrived | No |
| `defect` + `status:filed` | Your Bug Report is in triage; a maintainer will try to reproduce it | No — wait |
| `status:needs-info` | Triage couldn't reproduce it from your Details | **Yes** — reply with the missing steps/environment/evidence within ~7 days, or it closes as rejected |
| `status:accepted` | Confirmed real and reproducible — **counts toward your reward** | No |
| `status:routed` | Sent to the owning team — still counts | No |
| `status:closed` + `resolution:fixed` | Your bug was real and got fixed — **keeps its reward credit** | No 🎉 |
| `status:closed` + `resolution:rejected` | Not reproducible, out of bounds, or working as intended — not counted | Read the closing comment for the reason |
| `status:closed` + `resolution:duplicate` | Same root cause as an earlier report — credit goes to the **first** filer | Check the linked canonical issue |
| `needs:dapp-report-url` | Your ecosystem bug looks actionable | **Yes** — comment the dApp's own report/support link |
| `area:*`, `product:*`, `sev:P1`–`P4` | Routing bucket, product, and severity — maintainer/automation calls | No |

**Check before you file.** Duplicates credit the first reporter, so one click saves a
wasted report: filter issues by your product's label, e.g.
[`label:"product:0g-chat"`](https://github.com/0gfoundation/0g-testing-hub/issues?q=is%3Aissue+label%3A%22product%3A0g-chat%22).

**Your signup issue is your reward tracker.** It carries `l0:studio-done` /
`l0:pc-done` / `l0:cleared` for the surveys, and gets an advisory reward-progress
comment whenever one of your core defects changes state. `signup:needs-fix` on it means
your wallet needs correcting; `signup:duplicate` means you registered twice and the
earlier issue is the one that counts.

## For maintainers — the contract each label carries

Full runbook: [`.github/TRIAGE.md`](../.github/TRIAGE.md). The invariants:

- **One label per axis.** Every triaged defect carries exactly one `area:*`, one
  `sev:*`, one `status:*` — plus one `product:*` when derivable from the form. Two
  `status:*` labels on one issue is a bug (`setup-labels-and-board.sh` flags it with
  `needs:manual-label`).
- **Every close carries exactly one `resolution:*`**, applied *before or together
  with* `status:closed`. This is not bookkeeping — it's the message the tester receives.
  The notify bot suppresses its vague generic close comment when a resolution is
  present and posts the precise one instead.
- **`resolution:fixed` keeps reward credit.** The export counts `status:accepted`,
  `status:routed`, and `status:closed`+`resolution:fixed`. Closing a fixed defect never
  costs the tester their credit; closing as `rejected`/`duplicate` removes it.
- **`status:needs-info` is a promise to wait.** Use it instead of rejecting a
  plausible-but-incomplete repro. The bot tells the tester what to add and the ~7-day
  clock; sweep with `gh issue list --label 'status:needs-info'`. Reply arrives →
  back to `status:filed`.
- **`rc:<CODE>` groups, `resolution:duplicate` closes.** Duplicates get the shared
  `rc:` code + `resolution:duplicate` + a comment linking the canonical (earliest)
  issue, which gets `systemic` and is routed once. Register every code in
  [`data/root-causes.json`](../data/root-causes.json) first.
- **`needs:*` means a human must act**: `needs:manual-label` (maintainer — automation
  couldn't derive the area), `needs:dapp-report-url` (tester — bot notifies them; clear
  it once the link is posted).
- **Automation owns the first pass**: `feedback`, `defect`, `status:filed`, `area:*`,
  `product:*`, `coverage-log`, and everything on signup issues (`signup`,
  `signup:needs-fix`, `signup:duplicate`, `l0:*`) are applied by workflows. `sev:*`,
  status transitions, `rc:*`, `systemic`, and `resolution:*` are yours alone.

### Colors are per-axis on purpose

Areas are blues/purple, `product:*` a uniform light blue, `sev:*` a red→green impact
ramp, `status:*` runs grey → salmon (needs-info) → green (accepted) → teal (routed) →
dark grey (closed), `resolution:*` echoes its meaning (green fixed / red rejected /
grey duplicate), and `needs:*` is violet. Scanning a board row, no two labels that
routinely co-occur share a color.

### Changing labels

`.github/labels.yml` is the source of record. Edit it, then run
`scripts/setup-labels-and-board.sh` to sync GitHub (it also migrates renamed labels and
backfills missed issues). Keep the Product maps in `add-defects-to-board.yml` and
`setup-labels-and-board.sh` in lockstep, and update this guide, `README.md`,
`.github/TRIAGE.md`, and `docs/WORKFLOWS.md` together.
