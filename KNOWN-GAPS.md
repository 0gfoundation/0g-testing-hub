# Known gaps

Open items that surfaced in the submitter/maintainer friction review but are **not**
code bugs — each needs a product decision or real data to close, so they are tracked
here instead of being silently "fixed" in the wrong direction. The mechanical fixes
from the same review already shipped (see `git log`); these are what's left.

| # | Gap | Owner | Blocking on |
|---|-----|-------|-------------|
| G1 | Infra-only testers earn nothing until they also land an App Suite bug | 0G program | Reward-ladder decision |
| G2 | `data/owners.json` upstream owners are all `TBD` | Maintainers | Real owner/channel/tracker values |

---

## G1 — An accepted 0G Infra bug clears no tier on its own

**What.** L1 is gated to App Suite (`LEVELS.md`, and `issueLevel()` in
[`scripts/export-reward-report.mjs`](./scripts/export-reward-report.mjs)). A tester who
gets a real **0G Infra** defect accepted — but has no accepted App Suite bug — stays at
**0 credit** (or L0 if they also did the feedback forms). Verified in the export: an
infra-only author lands no tier.

**Current mitigation (shipped).** The accept comment no longer implies it counts:
[`notify-status-change.yml`](./.github/workflows/notify-status-change.yml) now tells an
Infra filer that the bug *alone* does not clear L1 and needs a paired App Suite bug to
reach L2. So the friction is now **disclosed**, not silent.

**Decision needed.** This is intended by the unlock-order design ("App Suite → 0G Infra"),
but it means a strong Infra-only contributor is uncredited. Either:
- **Keep as-is** — accept the disclosure above as sufficient, or
- **Add an Infra-only entry tier** (e.g. 1 accepted Infra bug ⇒ L1) — this requires
  changing `LEVELS.md`, `seasons/2026-apac/rewards.md`, the landing page, **and**
  `issueLevel()` together (they must stay in sync).

Do not change one without the others — the export script encodes the ladder.

## G2 — Upstream owners directory is unpopulated

**What.** [`data/owners.json`](./data/owners.json) lists every core product with
`owner` / `channel` / `tracker` all set to `TBD`. TRIAGE says "don't guess the owner —
look it up here," but right now there is nothing to look up.

**Why it isn't blocking today.** [`check-routed-evidence.mjs`](./scripts/check-routed-evidence.mjs)
only requires a `Routed to:` + `Upstream link:` comment, so routing still works — it just
relies on whoever is on triage knowing the owner, which is exactly the tribal-knowledge
dependency owners.json was meant to remove.

**Data needed.** Per product (App Suite ×4, 0G Infra ×4): the real upstream owner/team,
the notify channel, and the tracker location. Fill them in `data/owners.json` as they are
confirmed; no code change required.
