# Reward Preflight

Reward preflight is the lightweight payout safety layer for maintainers. It does
not change the tester journey or the CSV payout format. It surfaces structured
blockers before rewards are exported.

## Command

Run the normal export with blocker and audit outputs:

```bash
node scripts/export-reward-report.mjs \
  --repo 0gfoundation/0g-testing-hub \
  --signups-from-issues \
  --format csv \
  --out rewards.csv \
  --blockers-out rewards.blockers.json \
  --audit-out rewards.audit.json \
  --strict
```

For a preflight-only readout:

```bash
node scripts/export-reward-report.mjs \
  --repo 0gfoundation/0g-testing-hub \
  --signups-from-issues \
  --preflight \
  --blockers-out rewards.blockers.json
```

## Outputs

- `rewards.csv` remains the payout-facing export.
- `rewards.blockers.json` lists payout blockers and maintainer cleanup warnings.
- `rewards.audit.json` stores the generated report with blockers for review.

## Blocker Severity

`error` blockers are payout-critical. With `--strict`, any error blocker exits
non-zero.

Error blockers:

- `missing_signup`
- `missing_wallet`
- `duplicate_wallet`

`warning` blockers are maintainer cleanup items. They do not fail `--strict` in
the lightweight version.

Warning blockers:

- `accepted_missing_rc`
- `accepted_missing_area`
- `unregistered_rc`
- `ecosystem_counted_attempt`
- `routed_missing_evidence` — a routed defect whose comments lack a line carrying
  both `Routed to:` and `Upstream link:`. The exporter now pulls comments for the
  `status:routed` subset itself, so this fires in the normal gh-backed run. The
  same Markdown-prefix-tolerant detection backs `scripts/check-routed-evidence.mjs`.
- `duplicate_signup_folded` — an author has more than one signup issue. Entries
  fold to the earliest (lowest issue number) and the retained wallet should be
  verified. Replaces the former error-level `duplicate_signup`: folding is now
  deterministic, so this is a review note rather than a payout stop.
- `closed_missing_resolution` — a closed defect with no `resolution:*` label. It
  earns no credit and is invisible to payout; add a resolution label.

## Maintainer Use

Use `rewards.blockers.json` as the pre-payout queue:

1. Fix error blockers before payout.
2. Review warnings during triage cleanup.
3. Keep `data/root-causes.json` in sync with any `rc:*` labels used on accepted
   or routed defects.
4. Keep reward rules aligned across `README.md`, `docs/LEVELS.md`, and `issueLevel()`
   in `scripts/export-reward-report.mjs`. The export currently uses `issueLevel()`
   as the executable ladder; there is no separate JSON rules file.

This layer is intentionally lightweight: labels remain the workflow surface, and
the CSV export remains compatible with the previous payout process.
