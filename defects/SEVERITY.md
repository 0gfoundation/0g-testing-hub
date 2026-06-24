# Severity rubric (P1–P4)

The README requires every defect to carry a `P1 / P2 / P3 / P4` severity, but the
scale isn't defined anywhere — so two testers can tag the same bug differently and
the [signal-to-noise gate](../README.md#feedback-calibration-pull-back-when-drifting)
can't be applied consistently. This is that definition.

**Severity is impact-based.** Judge it against *what the user/dev cannot do*, not
against how hard the fix looks. A one-line CSS fix can still be a P1 if it hides the
only "confirm" button on the core flow.

| Sev    | Name    | Meaning                                                                                                  | Workaround? | Examples on a 0G app                                                                 |
| ------ | ------- | -------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| **P1** | Blocker | Core flow fully halted, or correctness / security / funds broken. The task **cannot** be completed.       | None         | Bridge confirm screen never loads; wrong balance shown; storage root mismatch; RPC unreachable for the whole app. |
| **P2** | Major   | A key feature is broken or visibly wrong, but the flow can still be completed another way.                | Exists / partial | One of three swap routes errors; faucet works but shows a misleading success toast; pagination skips a page. |
| **P3** | Minor   | Degraded experience, recoverable error, or a caller/config-fixable failure. Doesn't block the core flow. | Easy         | Wrong-network prompt appears late; missing env var produces an unclear error; an edge-case input is rejected. |
| **P4** | Trivial | Cosmetic only — copy, spacing, alignment, casing. Zero functional impact.                                | N/A          | Hyphen in "on-chain", overflowing label, untranslated tooltip.                      |

## How this interacts with the SNR gate

The README says: *"a round that's all P3/P4 trivia with no reproducible P1/P2 → you're
nitpicking; pull back to core flows."* With the table above that gate becomes mechanical:

- A round with **0 reproducible P1/P2** is a low-signal round → return to happy/error paths.
- **P4 is for manual downgrade only** — don't open a round by hunting cosmetics.
- If you're unsure between two levels, file at the **lower** number (more severe) and let
  triage downgrade; under-reporting a blocker is worse than over-reporting it.

## Routing × severity

Ownership (App Suite / 0G Infra / Ecosystem dApps) is **orthogonal** to
severity. A P1 in an Ecosystem dApp is still *record-only* per the README; a P3 in 0G Infra
still routes upstream. Tag both fields independently — see [`TEMPLATE.md`](./TEMPLATE.md).
