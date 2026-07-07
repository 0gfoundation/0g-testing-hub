# Severity rubric (P1–P4)

Maintainers assign every triaged defect a `P1 / P2 / P3 / P4` severity (`sev:*` label)
at triage — the Submit Feedback form no longer asks testers to pick one. This rubric
keeps triage consistent: severity is a quality signal for core defects, and it stays
orthogonal to area for Ecosystem coverage.

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

The program rejects low-signal rounds dominated by P3/P4 nits with no reproducible
P1/P2. With the table above that gate becomes mechanical:

- A round with **0 reproducible P1/P2** is a low-signal round → return to happy/error paths.
- **P4 is for manual downgrade only** — don't open a round by hunting cosmetics.
- When triage is unsure between two levels, assign the **lower** number (more severe) first
  and downgrade later; under-rating a blocker is worse than over-rating it.

## Routing × severity

Area (App Suite / 0G Infra / Ecosystem dApps) is **orthogonal** to
severity. A P1 in an Ecosystem dApp is still useful coverage outside the core reward
ladder; a P3 in 0G Infra still routes upstream. Tag both labels independently — see
[`TEMPLATE.md`](./TEMPLATE.md).
