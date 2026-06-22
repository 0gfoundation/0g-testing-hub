<!--
SAMPLE / format demo — but a real, reproducible finding (not fabricated).
Created by copying defects/TEMPLATE.md and filling it in. Severity per defects/SEVERITY.md.
-->
---
title: "Storage Scan still served from legacy 'newton' hostname (301 to galileo)"
ownership: "0G Infra"
product: "0G Storage Scan"
severity: "P4"
status: filed
reproducible: true
environment:
  browser: "curl 8.x / any browser (host-level, browser-agnostic)"
  wallet: ""
  chain_id:
  network: "galileo"
root_cause_code: "LEGACY_NEWTON_HOSTNAME"
source: manual
---

## Repro steps

1. Request the Storage Scan URL as documented in the brief/README:
   `curl -I https://storagescan-newton.0g.ai/`
2. Observe the response.
3. (Optional) follow the redirect: `curl -L https://storagescan-newton.0g.ai/`

## Expected result

The documented explorer URL points at the **current** testnet host (galileo)
directly, with no legacy testnet name in the address bar.

## Actual result

The `newton` host returns `HTTP/2 301` with `location: https://storagescan-galileo.0g.ai/`
(`server: Vercel`), then lands on the galileo host with `200`. The redirect works, but the
**documented entry point carries the retired "newton" testnet name** — a legacy term the
brand guidance says to avoid. Anyone bookmarking/citing the documented URL inherits a
dependency on the redirect staying alive.

```
$ curl -sS -I https://storagescan-newton.0g.ai/
HTTP/2 301
location: https://storagescan-galileo.0g.ai/
server: Vercel
```

## Screenshot / recording

(curl output above; no GUI needed to reproduce.)

## Root-cause guess (optional)

Newton → Galileo testnet rename; the old host was kept as a 301 alias but stale references
(docs, dashboards, bookmarks) still publish the legacy name instead of the galileo URL.

<!--
Aggregation note (T3): root_cause_code "LEGACY_NEWTON_HOSTNAME" is a candidate SYSTEMIC
pattern — "newton" references are likely to linger in more than one place across the
ecosystem (other docs, links, env config). If a second defect surfaces with the same code,
do NOT file per-app: open ONE systemic issue and route it upstream (docs/config). To see
the group at any time:
    grep -rl 'root_cause_code: "LEGACY_NEWTON_HOSTNAME"' defects/
-->
