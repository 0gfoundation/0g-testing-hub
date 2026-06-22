# Season 1 (2026 · APAC) — Rewards

> Mechanics live in [`../../LEVELS.md`](../../LEVELS.md). This file is just **Season 1's numbers**.
> **All rewards are 0G Compute Credit** — no physical goods. The retired Gift Box / Hat are gone;
> there is no shipping address. We collect a **wallet address (0G mainnet EVM)** to send Credit.

## Credit per level

Payout = the **Credit of the highest level you reach** (not cumulative). Badges accumulate.

| Lv | Title | 0G Compute Credit |
|----|------|:-----------------:|
| **L0** | Recruit | **10** + entry badge |
| **L1** | Tester | **20** |
| **L2** | Infra Pioneer | **40** |
| **L3** | Bug Hunter | **60** |
| **L4** | Systemic Hunter | **80** |
| **L5** | Master | **100** + limited Master identity |

## Season knobs

The pass conditions in [`../../LEVELS.md`](../../LEVELS.md#pass-conditions) leave two
thresholds to each season:

- **L3 accepted threshold:** **≥3** accepted (deduped) defects. _(default; adjust per season)_
- **L5 leaderboard top tier:** top **N** testers earn 100 Credit + Master identity. _N = TBD before launch._

## Hand-in

- **Every reward is Credit**, so every tier collects the same thing: a **wallet address
  (0G mainnet EVM)** to receive 0G Compute Credit. No shipping address is collected.
- A level only pays once triage has **accepted** its required defect(s) and the level's
  **0G Private Computer Feedback** is on file. "Felt off" and not-reproducible reports don't count.
- Deduped: several reports sharing one root cause are **one** rewardable defect, credited to the
  first filer.
