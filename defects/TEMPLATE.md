<!--
Reference template only. Live feedback is filed through the GitHub Submit Feedback
form, not by copying this file into defects/*.md. Keep the tester fields aligned
with the issue form so example defects and maintainer docs use the same field
vocabulary. Everything under "Maintainer-only" is triage metadata — never asked
of testers.
-->
---
title: ""                       # one line, imperative ("Bridge confirm screen never loads")

# --- Tester input (mirrors the Submit Feedback form) ---
category: ""                    # Bug Report | Feature Request | Other
product: ""                     # which app, e.g. "0G Hub", "TradeGPT", or Other

# --- Maintainer-only (filled at triage, never tester input) ---
area: ""                        # app-suite | 0g-infra | ecosystem — derived from product, corrected at triage
status: filed                   # filed | accepted | routed | closed
reproducible: true              # README rule: only reproducible findings count
root_cause_code: ""             # OPTIONAL stable tag for grouping, e.g. "CHAIN_ID_MISSING",
                                # "CAPTCHA_TOKEN_EXPIRY", "STORAGE_ROOT_MISMATCH".
                                # Two defects sharing this value are the SAME systemic issue.
reported_to_dapp_url: ""        # Ecosystem only: the dApp's own report link, collected via issue comment
source: manual                  # manual | tool-generated   (how this defect was produced)
---

## Details

What happened?

Steps to reproduce:

1.
2.
3.

Expected:

Actual:

## Evidence

Paste screenshots, recordings, links, or any extra context here.

<!--
Aggregation tip: when several defects share the same `root_cause_code`
(e.g. Chain ID 16661 missing from a mapping table across multiple apps), open ONE
systemic issue that links them and route it upstream (SDK / docs / config) rather
than triaging each app separately. That is the README's T3 "intel routed" end state.
-->
