# `defects/` — reference material

Defects are now filed and tracked as **GitHub issues**, not files. The
[Defect report form](../.github/ISSUE_TEMPLATE/defect-report.yml) structures them at intake,
labels carry the routing axes, and aggregation runs against the issue tracker — see
[`.github/TRIAGE.md`](../.github/TRIAGE.md). This folder is now **reference only**:

1. **[`SEVERITY.md`](./SEVERITY.md)** — the `P1–P4` rubric the form's severity dropdown
   and the README's signal-to-noise gate both rely on.
2. **[`TEMPLATE.md`](./TEMPLATE.md)** — the canonical field list (the form mirrors it).
3. **`*.md` example defects** — two worked examples (`appsuite-coop-…`, `storagescan-legacy-…`)
   showing what a fully-specified defect looks like.

## Aggregation moved to the issue tracker

The high-value end state is **routed systemic intel**, not a pile of per-app tickets.
That grouping used to mean grepping YAML front-matter across files; it's now `gh` against
labels, with no hand-copy from intake. The `area:`, `sev:`, `status:`, and `rc:<CODE>`
labels are the axes you aggregate on:

```bash
# every issue sharing a root cause — the systemic-pattern view
gh issue list --label 'rc:CHAIN_ID_MISSING' --state all

# unrouted blockers (--label is AND-only; use --search for negation)
gh issue list --search 'label:"sev:P1" -label:"status:routed" state:open'
```

For the full query set and the de-dup / reward rule, see [`.github/TRIAGE.md`](../.github/TRIAGE.md).

<details><summary>Legacy: grepping the example files</summary>

The example `*.md` files still carry YAML front-matter, so the original one-liners work on them:

```bash
grep -rl 'root_cause_code: "CHAIN_ID_MISSING"' defects/
grep -rlE 'severity: "P[12]"' defects/ | xargs grep -L 'status: routed'
```

</details>
