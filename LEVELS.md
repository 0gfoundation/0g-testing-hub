# 0G Testing Hub — Levels

> **Evergreen spec.** This file defines how the reward ladder works. The Credit a given
> season pays out lives in that season's folder — see
> [`seasons/2026-apac/rewards.md`](./seasons/2026-apac/rewards.md).

## The shape

The public flow is intentionally simple:

```text
Sign up → Feedback x2 → Recruit
Then: Submit bug report → Check → Reward / Ignore → Repeat
```

L0 Recruit is the entry level: it clears with 0G App Suite Feedback / 0G Studio
Feedback plus 0G Private Computer Feedback and does not require a bug report.
From L1 upward, valid accepted defects climb the reward ladder.
Invalid, duplicate, or unreproducible reports do not count toward rewards.

## The ladder

Keep this table in sync with the landing page.

| Lv | Title | Clears with | Reward |
|----|-------|-------------|:------:|
| **L0** | Recruit | 0G App Suite Feedback / 0G Studio Feedback + 0G Private Computer Feedback; no bug required | **10 0G Compute Credit** |
| **L1** | Tester | 1 accepted · App Suite | **20 0G Compute Credit** |
| **L2** | Infra Pioneer | 2 accepted · App Suite + 0G Infra | **40 0G Compute Credit** |
| **L3** | Master | 5+ accepted · incl. 1 systemic | **100 0G Compute Credit** |

## Pass conditions

Except for L0, progression is driven by centralized triage, not by raw submissions.

| Signal | Counts? | Why |
|--------|---------|-----|
| 0G App Suite Feedback / 0G Studio Feedback + 0G Private Computer Feedback | L0 only | Recruit is feedback-only. |
| 1 accepted App Suite defect | L1 | Tester proves the first valid first-party bug. |
| 2 accepted defects across App Suite + 0G Infra | L2 | Infra Pioneer covers both core buckets. |
| 5+ accepted defects, including 1 `systemic` finding | L3 | Master is the accepted-defect cap and requires systemic signal. |
| `status:accepted` + reproducible + not duplicate | Reward count | It is a valid defect. |
| Duplicate of an existing root cause | No new reward count | It folds into the canonical issue via the same `rc:*` code. |
| Not reproducible / unclear / "felt off" | No | It cannot be routed. |
| Record-only Ecosystem dApp issue | Coverage only | Bugs belong to that dApp's own channel. |

The exact level assignment for a season is based on accepted, deduped defects and the
season's operating rules. Do not reintroduce retired ladder data unless the landing
page and season rewards are changed first.

## Rules

- **Recruit is feedback-only.** L0 requires 0G App Suite Feedback / 0G Studio Feedback + 0G Private Computer Feedback and no bug report.
- **Accepted beats submitted after Recruit.** L1+ rewards follow valid defects, not filing volume.
- **Deduped, not raw.** Several reports sharing one root cause are one rewardable
  finding, credited to the canonical accepted issue.
- **Routable or it does not count.** Every accepted defect needs ownership, severity,
  environment, repro steps, expected / actual behavior, and enough evidence to route.
- **Hard boundaries still apply.** Never touch funds or keys; Ecosystem dApps are
  record-only.
