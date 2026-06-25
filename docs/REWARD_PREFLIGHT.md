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

Initial error blockers:

- `missing_signup`
- `missing_wallet`
- `duplicate_signup`
- `duplicate_wallet`

`warning` blockers are maintainer cleanup items. They do not fail `--strict` in
the lightweight version.

Initial warning blockers:

- `accepted_missing_rc`
- `accepted_missing_severity`
- `accepted_missing_area`
- `unregistered_rc`
- `ecosystem_counted_attempt`
- `routed_missing_evidence` when issue comments are available to the exporter

## Maintainer Use

Use `rewards.blockers.json` as the pre-payout queue:

1. Fix error blockers before payout.
2. Review warnings during triage cleanup.
3. Keep `data/root-causes.json` in sync with any `rc:*` labels used on accepted
   or routed defects.
4. Keep README reward rules and `data/reward-rules.json` aligned.

This layer is intentionally lightweight: labels remain the workflow surface, and
the CSV export remains compatible with the previous payout process.
