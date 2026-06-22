---
title: "COOP: same-origin breaks Coinbase/Base wallet SDKs and blocks Privy embedded wallet across App Suite"
ownership: "App Suite"
product: "0G App + Genome + 0G Chat + PandaClaw (shared frontend headers)"
severity: "P2"
status: filed
reproducible: true
environment:
  browser: "Chromium 148 headless (Playwright); host-level header, browser-agnostic"
  wallet: "Coinbase Wallet SDK / Base Account SDK / Privy embedded wallet"
  chain_id:
  network: "aristotle (mainnet) for app.0g.ai; dev build for 0g-vibe pages"
root_cause_code: "COOP_BREAKS_EMBEDDED_WALLET"
source: manual
---

## Repro steps

1. Inspect response headers of the App Suite frontends:
   `curl -sS -D - -o /dev/null https://app.0g.ai/`
   `curl -sS -D - -o /dev/null https://dev.0g-vibe.pages.dev/genome`
2. Load either app in a browser with the console open.
3. Observe the wallet-SDK console errors and the blocked Privy request.

## Expected result

Embedded / popup-based wallet login (Coinbase Smart Wallet, Base Account, Privy
embedded wallet) initialises without being blocked by the page's cross-origin
isolation policy.

## Actual result

Both hosts send **`cross-origin-opener-policy: same-origin`** and
**`cross-origin-embedder-policy: credentialless`**. Consequences observed at runtime:

- Console (0G App): `Coinbase Wallet SDK requires the Cross-Origin-Opener-Policy header
  to not be set to 'same-origin'. This is to ensure that the SDK can communicate with
  the Coinbase Smart Wallet app.`
- Console (0G App): identical error for **Base Account SDK**.
- Network (all four App Suite hosts): `net::ERR_BLOCKED_BY_RESPONSE` on
  `https://auth.privy.io/apps/<id>/embedded-wallets?...` — the Privy embedded-wallet
  iframe/response is hard-blocked under `COEP: credentialless`.

Confirmed: the headers, the two SDK errors, and the Privy network block all reproduce.
Inferred (needs a manual connect-flow pass to confirm user-visible failure): users
choosing Coinbase Smart Wallet / Base / Privy-embedded as their login method cannot
complete sign-in; injected (MetaMask) / WalletConnect likely still work, which is why
this is P2 (workaround exists) rather than P1. If Privy is the *sole* sign-in path on
the 0g-vibe pages ("Sign in to sync projects and access 0G Compute"), escalate to P1.

```
$ curl -sS -D - -o /dev/null https://app.0g.ai/
cross-origin-embedder-policy: credentialless
cross-origin-opener-policy: same-origin
```

## Screenshot / recording

/tmp/0g-qa/shots/0g-app.png (rendered shell). Primary evidence is the header + console
output above — more reproducible than a screenshot.

## Root-cause guess (optional)

Architectural tension, not a typo: the 0G App "app builder" embeds **StackBlitz
WebContainers** (CSP `frame-src` includes `https://stackblitz.com` and
`https://*.webcontainer-api.io`), and WebContainers **require** cross-origin isolation
(`COOP: same-origin` + `COEP`). That same isolation is exactly what Coinbase/Base SDKs
and Privy's embedded wallet refuse to run under. The fix is not "remove COOP" (that
breaks the builder) but to isolate the wallet-connect surface — e.g. COOP
`same-origin-allow-popups` where popups are needed, a dedicated non-isolated
auth origin/route, or COEP allowlisting (CORP) for the Privy endpoint.

<!--
Aggregation note (T3): root_cause_code "COOP_BREAKS_EMBEDDED_WALLET" spans 4 App Suite
products that share one header config — this is ALREADY the systemic view. Do NOT file
four per-app tickets; route this ONE finding upstream to the shared frontend/header
config owner. Group at any time:
    grep -rl 'root_cause_code: "COOP_BREAKS_EMBEDDED_WALLET"' defects/
-->
