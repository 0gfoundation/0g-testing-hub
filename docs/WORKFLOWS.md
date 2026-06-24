# Workflows — tester & maintainer

How a defect travels from a tester's form to a payout row. Two actors, one automation
layer between them. This is the visual companion to [`.github/TRIAGE.md`](../.github/TRIAGE.md)
(the maintainer runbook) and [`LEVELS.md`](../LEVELS.md) (the reward ladder).

- **Tester** only ever fills forms — never touches labels, the board, or `defects/*.md`.
- **Automation** (GitHub Actions) labels, boards, and closes the feedback loop.
- **Maintainer** runs the label → verify → dedup → route → export pipeline.

## End-to-end flow

```mermaid
flowchart TD
    subgraph T["🧑‍💻 Tester — fills forms only"]
      T1["Sign up once<br/>wallet + GitHub username"]
      T2["L0: two feedback forms<br/>no bug required"]
      T3["Find + reproduce a bug"]
      T4["File Defect report form<br/>one issue per defect"]
    end

    subgraph A["⚙️ Automation — GitHub Actions"]
      A1["Issue opened<br/>defect + status:filed"]
      A2["add-defects-to-board.yml<br/>add to board #19 · parse area/sev · set Triage"]
      A3["notify-status-change.yml<br/>auto-comment outcome to the tester"]
    end

    subgraph M["🛠️ Maintainer — triage pipeline"]
      M1["Verify · correct area:* / sev:*"]
      M2{"Reproducible &<br/>in bounds?"}
      M3["status:accepted<br/>★ counts toward reward"]
      M4["status:closed + reason"]
      M5["Dedup — find-duplicate-candidates.mjs<br/>rc: code · systemic · collapse to first filer"]
      M6["Route — check-routed-evidence.mjs<br/>Routed to / Upstream link → status:routed"]
      M7["export-reward-report.mjs<br/>join username → wallet · tally L0–L3"]
    end

    T1 --> T2 --> T3 --> T4 --> A1 --> A2 --> M1 --> M2
    M2 -- yes --> M3 --> M5 --> M6 --> M7
    M2 -- no --> M4
    M3 -. triggers .-> A3
    M4 -. triggers .-> A3
    M6 -. triggers .-> A3
    A3 -. result comment .-> T4
    T1 -. "GitHub username = join key" .-> M7
```

## Status state machine → board columns

The reward count reads off these labels. `status:accepted` is the state that counts.

```mermaid
stateDiagram-v2
    [*] --> filed: tester files (auto)
    filed --> accepted: reproduced
    filed --> closed: not repro / out of bounds
    accepted --> routed: routing evidence added
    accepted --> closed: duplicate (folds to first filer)
    routed --> closed: resolved upstream
    closed --> [*]
```

| Status label | Board column | Rewardable? |
|---|---|:---:|
| `status:filed` | Triage | no (unvalidated) |
| `status:accepted` | Accepted | **yes** |
| `status:routed` | Routed | **yes** |
| `status:closed` | Closed | no |

## Reward ladder (what the export computes)

Payout = Credit of the **highest level reached**. Counts **accepted + deduped** core
(App Suite / 0G Infra) findings; Ecosystem coverage logs are excluded. Full rules in
[`LEVELS.md`](../LEVELS.md).

| Lv | Clears with | Credit |
|----|-------------|:---:|
| **L0** Recruit | two feedback forms; no bug | 10 |
| **L1** Tester | 1 accepted · App Suite | 20 |
| **L2** Infra Pioneer | 2 accepted · App Suite + 0G Infra | 40 |
| **L3** Master | 5+ accepted · incl. 1 `systemic` | 100 |

## Two things the automation gets right (and recently fixed)

- **Triage progress is not clobbered.** `add-defects-to-board.yml` runs only on issue
  *open* or when the `defect` label is added — not on every later label change — so moving
  an issue to `status:accepted` no longer gets reset back to Triage.
- **The accept comment tells the truth per area.** `notify-status-change.yml` branches the
  message: App Suite accept counts; an **0G Infra** accept alone does **not** clear L1
  (needs a paired App Suite bug → L2); an **Ecosystem** coverage log is record-only and
  does **not** count.

Open items that are policy/data decisions, not code: see [`KNOWN-GAPS.md`](../KNOWN-GAPS.md).
