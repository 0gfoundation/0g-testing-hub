# 0G Testing Hub — Levels

> **Evergreen spec.** This file defines *how* progression works. The Credit a given season
> pays out lives in that season's folder — see [`seasons/2026-apac/rewards.md`](./seasons/2026-apac/rewards.md).
> When a season ends the ladder resets; **badges persist** as identity history.

## The shape

You don't sign up for a fixed tier. You **climb**. The funnel is wide at the bottom
(anyone clears L0) and narrow at the top (L5 is leaderboard-gated). You beat one "monster,"
level up, and that **unlocks the next module** — *test more, extend outward*.

```
wide entry ─────────────────────────────────────────► big top reward
        ┌──────── CORE ────────┐   ┌──── extend outward ────┐
L0 ───► L1 App Suite ─► L2 Infra ─► L3 Ecosystem ─► L4 Hackathon ─► L5 Master
        (bug + feedback)            (record-only breadth)
└──────────────── every level also submits 0G Private Computer Feedback ────────┘
```

- **Core = L1 + L2** — 0G App Suite + 0G Infra, each delivering an accepted **Bug Report + Feedback**. This is where the program's real value lands.
- **Extend outward** — L3 Ecosystem → L4 Hackathon → L5 full coverage. *Test more, reach further.*
- **Compute runs through every level** — every level requires one **0G Private Computer Feedback**: *actually run a model on 0G Compute once, then submit it.* No lite version, every level. It's the program's #1 goal, so it's the spine, not a single rung.

## The ladder

| Lv | Title | Module gate — the "monster" | Every level also | Unlocks | Reward |
|----|-----------|------------------------------|------------------|---------|--------|
| **L0** | Recruit | Sign up + connect wallet, walk the **App Suite** happy path | + **0G Private Computer Feedback** | → App Suite depth | Entry **badge** + Credit |
| **L1** | Tester | **App Suite: accepted Bug Report + Feedback** *(core)* | + **0G Private Computer Feedback** | → 0G Infra | Credit |
| **L2** | Infra Pioneer | **0G Infra: accepted Bug Report + Feedback** *(core)* | + **0G Private Computer Feedback** | → Ecosystem | Credit |
| **L3** | Bug Hunter | **Ecosystem** breadth (record-only walk) + **≥3 accepted** total | + **0G Private Computer Feedback** | → Hackathon | Credit |
| **L4** | Systemic Hunter | **Hackathon** breadth + one **`systemic`** finding | + **0G Private Computer Feedback** | → leaderboard | Credit |
| **L5** | Master 👑 | **Cover every module** + finish in the season leaderboard's top tier | + **0G Private Computer Feedback** | — (cap) | Biggest Credit + **limited Master identity** |

## Pass conditions

A level clears only when **all** of its rows are satisfied. Judgement runs entirely off the
centralized triage labels — no separate scoring. Every level also requires its **Compute
Feedback**: *run a model on 0G Compute once + submit it.*

| Lv | Must produce (all required) | Objective check |
|----|-----------------------------|-----------------|
| **L0** | ① Sign-up submitted (incl. 0G EVM wallet) ② walk **App Suite** happy path ③ 0G Private Computer Feedback | sign-up on file + 0G Private Computer Feedback on file + happy-path evidence (screenshot / one observation). **No accepted defect required** (warm-up). |
| **L1** | ① App Suite **≥1 accepted Bug** ② App Suite Feedback (0G Studio form) ③ 0G Private Computer Feedback | issue has `area:app-suite` + `status:accepted` + Studio Feedback submitted + 0G Private Computer Feedback on file. |
| **L2** | ① 0G Infra **≥1 accepted Bug** ② Infra Feedback ③ 0G Private Computer Feedback | issue has `area:0g-infra` + `status:accepted` + 0G Private Computer Feedback. *Testing 0g-cc routes to Compute, so it can satisfy Infra testing and 0G Private Computer Feedback at once.* |
| **L3** | ① **Ecosystem** walked (record-only: load + connect + main flow once) ② **≥3 accepted** total (App Suite + Infra, deduped) ③ 0G Private Computer Feedback | ≥3 `status:accepted` issues (after dedup) + Ecosystem coverage logged. |
| **L4** | ① **Hackathon** walked ② one finding triage tags **`systemic`** (one root cause across apps, same `rc:` code) ③ 0G Private Computer Feedback | an issue credited to you carries the `systemic` label. |
| **L5** | ① **every module covered** (all four buckets logged) ② season leaderboard **top tier** ③ 0G Private Computer Feedback | full coverage + leaderboard standing (accepted-deduped count + 0G Private Computer Feedback quality). |

> **Season knobs** (live in [`seasons/2026-apac/rewards.md`](./seasons/2026-apac/rewards.md)): the L3
> "≥3 accepted" threshold and the L5 leaderboard top-tier size are set per season.

## Rules

- **Sequential unlock.** Clear a level's monster before the next module's door opens.
- **0G Private Computer Feedback every level.** No level counts without its 0G Private Computer Feedback — *run a model
  once + submit it.* The primary deliverable is woven through the whole climb, not a single gate.
- **Payout = highest level reached** (Credit), unless a season's `rewards.md` says otherwise.
  **Badges accumulate**; Credit does **not** stack across levels.
- **Driven by triage labels.** `status:accepted`, `systemic`, and module coverage are what
  move you up — progression is a direct product of the centralized triage the program runs.
  No separate scoring system.
- **Deduped, not raw.** "≥3 accepted" means three *deduped* accepted defects; five reports of
  one root cause is one. See [`README.md` → What counts](./README.md#what-counts-as-a-rewardable-defect).
- **Hard boundaries still apply.** Never touch funds/keys; Ecosystem & Hackathon dApps are
  record-only. Climbing never unlocks signing or sending.

## Badges

Badges are the ladder's "identity" — a visible marker of how far you've climbed (the identity / equipment
idea). **Season 1 ships them as a claimable cosmetic role + leaderboard standing**, tracked off
existing signals: sign-up form, 0G Private Computer Feedback, and the defect board's `accepted` / `systemic` labels.

Higher-tier perks (Credit multipliers — the "equipment" — and access) and any onchain form
are **open future directions, not commitments**. Don't present anything unbuilt as shipped.
