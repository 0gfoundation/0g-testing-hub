<!--
Copy this file to defects/<short-slug>.md and fill it in.
The YAML front-matter is the machine-aggregatable part: it's what lets you run the
README's "aggregate repeated patterns -> 1 systemic issue" step without re-reading
every defect by hand. Keep the keys; replace the values. The prose below the `---`
is for humans (repro detail, screenshots, notes).
-->
---
title: ""                       # one line, imperative ("Bridge confirm screen never loads")
ownership: ""                   # App Suite | 0G Infra | Ecosystem dApps
product: ""                     # which app, e.g. "0G Hub", "TradeGPT"
severity: ""                    # P1 | P2 | P3 | P4  (see SEVERITY.md)
status: filed                   # filed | routed | closed
reproducible: true              # README rule: only reproducible findings count
environment:
  browser: ""                   # e.g. "Chrome 124 / macOS"
  wallet: ""                    # e.g. "MetaMask 11.x" (omit if N/A)
  chain_id:                     # e.g. 16661  (the recurring "missing Chain ID" pattern is easy to group on)
  network: ""                   # e.g. "mainnet" | "galileo" | "aristotle"
root_cause_code: ""             # OPTIONAL stable tag for grouping, e.g. "CHAIN_ID_MISSING",
                                # "CAPTCHA_TOKEN_EXPIRY", "STORAGE_ROOT_MISMATCH".
                                # Two defects sharing this value are the SAME systemic issue.
reported_to_dapp_url: ""        # Ecosystem only: URL for the dApp's own issue/form/support report.
source: manual                  # manual | tool-generated   (how this defect was produced)
---

## Repro steps

1.
2.
3.

## Expected result

## Actual result

## Screenshot / recording

## Reported to dApp URL (Ecosystem only)

## Root-cause guess (optional)

<!--
Aggregation tip: when several defects share the same `root_cause_code`
(e.g. Chain ID 16661 missing from a mapping table across multiple apps), open ONE
systemic issue that links them and route it upstream (SDK / docs / config) rather
than triaging each app separately. That is the README's T3 "intel routed" end state.
-->
