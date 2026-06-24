# 0g-testing-hub

**0g-testing-hub** is a testing program for 0G Ecosystem: submit the required feedback, test target apps, file reproducible bugs, and climb **L0-L3** for 0G Compute Credit. **Not a code project** - no build, test, or package manager here.

## Jump to

- [Levels & rewards](#levels--rewards)
- [Test targets](#test-targets)

## Levels & rewards

![Reward levels](./Assets/reward-level.png)

All rewards are **0G Compute Credit**; payout = the Credit of your **highest level reached** (not cumulative).

| Step | Reach | How it clears | Where to go | Credit |
|------|-------|---------------|-------------|:------:|
| **Sign up** | — | Register once: 0G wallet + GitHub username | [Testing intake](https://forms.gle/Mhm8YKXL9Kbvt11S8) | — |
| **1** | **L0** Recruit | Two feedback forms; no bug required | [0G Studio Feedback (App Suite, all four apps)](https://forms.gle/ymEdZrdTNs4giEm1A) · [0G Private Computer Feedback (every level)](https://forms.gle/G919xrbRyfVJxPZe8) | **10 0G Compute Credit** |
| **2** | **L1** Tester | 1 accepted · App Suite | [Defect report form](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=defect-report.yml&labels=defect,status:filed) | **20 0G Compute Credit** |
| **3** | **L2** Infra Pioneer | +1 accepted · 0G Infra (2 total) | [Defect report form](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=defect-report.yml&labels=defect,status:filed) | **40 0G Compute Credit** |
| **4** | **L3** Master | 5+ accepted · incl. 1 `systemic` | [Defect report form](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=defect-report.yml&labels=defect,status:filed) | **100 0G Compute Credit** |

Track your filed issues on the [Defect board #19](https://github.com/orgs/0gfoundation/projects/19). The more **accepted, deduped** defects you surface, the higher you climb - Master is the cap.

**Won't be accepted / out of bounds:**

- **Duplicates** or **not-reproducible** "felt off" reports.
- **Feature requests** - unless the docs already promised the behavior.
- **P4 cosmetics** with no reproducible P1/P2.
- **Record-only dApp bugs** - route to the dApp's own channel; the Hub only logs coverage. If you log Ecosystem coverage here, include the dApp report URL when there is an actionable bug.
- **Funds / keys** - never sign or send; stop at the transaction-confirmation screen on swap / bridge / faucet / sign flows.

## Test targets

<!-- targets:start -->

### 0G App Suite · core (L0-L1)

Focus: onboarding, wallet connect, the core journey, and repeat-user behavior - stale sessions, captcha/token expiry, Chain ID switches, refresh/back-button interrupts.

- [**0G App**](https://app.0g.ai/) - flagship app builder, live on mainnet
  - Checklist:
    - Load app
    - Connect wallet
    - Walk the main app-builder journey
    - Refresh or return with the same wallet
    - Trigger one expected error path
- [**Genome**](https://dev.0g-vibe.pages.dev/genome) - paste a URL/screenshot, produces production-grade design DNA
  - Checklist:
    - Load app
    - Connect wallet if prompted
    - Submit one valid URL or screenshot
    - Try one invalid/unsupported input
    - Refresh or retry after a completed run
- [**0G Chat**](https://dev.0g-vibe.pages.dev/private-chat) - end-to-end encrypted private chat (UI still WIP)
  - Checklist:
    - Load app
    - Connect wallet
    - Open or create a chat
    - Send one test message without exposing secrets
    - Trigger one expected empty/error state
- [**PandaClaw**](https://dev.0g-vibe.pages.dev/agents) - agent launchpad + skill marketplace (Hermes + OpenClaw harness)
  - Checklist:
    - Load app
    - Connect wallet
    - Browse an agent or skill
    - Walk one launch/configure flow until any confirmation boundary
    - Trigger one expected error path

### 0G Infra · core (L2)

Focus: correctness over polish - explorer data accuracy, RPC / Chain ID handling, and 0g-cc inference / storage paths. For bridge / swap / faucet / sign flows, stop at confirmation.

- [**0G Hub**](https://hub.0g.ai/) - bridge / swap / faucet / portfolio
  - Checklist:
    - Load app
    - Connect wallet
    - Walk bridge/swap/faucet flow until confirmation screen
    - Check portfolio/balance display for obvious mismatch
    - Do not sign or send
- [**0G Storage Scan**](https://storagescan-newton.0g.ai/) - storage explorer
  - Checklist:
    - Load explorer
    - Search or open a known storage item if available
    - Verify displayed metadata is internally consistent
    - Try one invalid search/input
    - Capture URL and visible identifiers
- [**Chain Scan**](https://chainscan.0g.ai/) - block explorer
  - Checklist:
    - Load explorer
    - Open a block/transaction/address page
    - Check balance/tx metadata for obvious mismatch
    - Try one invalid search/input
    - Capture URL and visible identifiers
- [**0G Code to Coin (0g-cc)**](https://www.npmjs.com/package/@0gfoundation/0g-cc) - official MCP server routing AI inference / fine-tuning / storage to 0G Compute; install with `npm install @0gfoundation/0g-cc`
  - Note: `0g-cc` is a CLI / MCP server, not a web app. Add it (`claude mcp add 0g-cc npx @0gfoundation/0g-cc`), then walk one inference / storage flow plus one error path. The funds/keys boundary still applies.
  - Checklist:
    - Install or inspect the package
    - Add it as an MCP server
    - Run one inference or storage flow
    - Trigger one error path such as missing key/network issue
    - Do not sign, send, launch, or trade

### Ecosystem dApps · record-only

Focus: load, connect a wallet on 0G, walk the main flow once, log obvious breakage. Don't deep-dive.

- [**TradeGPT**](https://tradegpt.finance/) - AI-driven DEX
  - Checklist:
    - Load app
    - Connect wallet on 0G
    - Walk the main DEX flow until confirmation boundary
    - Report actionable bugs to the dApp channel
    - Log coverage in the Hub only
- [**Jaine**](https://jaine.fi/) - DEX/liquidity (LIC)
  - Checklist:
    - Load app
    - Connect wallet on 0G
    - Walk the main liquidity/DEX flow until confirmation boundary
    - Report actionable bugs to the dApp channel
    - Log coverage in the Hub only
- [**Oku**](https://oku.trade/) - concentrated liquidity DEX
  - Checklist:
    - Load app
    - Connect wallet on 0G
    - Walk the main DEX flow until confirmation boundary
    - Report actionable bugs to the dApp channel
    - Log coverage in the Hub only
- [**AI Arena**](https://aiarena.io/) - PvP, train AI agents
  - Checklist:
    - Load app
    - Connect wallet if applicable
    - Walk the train/play main flow once
    - Report actionable bugs to the dApp channel
    - Log coverage in the Hub only
- [**CARV**](https://carv.io/) - gamer identity
  - Checklist:
    - Load app
    - Connect wallet if applicable
    - Walk the identity/profile main flow once
    - Report actionable bugs to the dApp channel
    - Log coverage in the Hub only
- [**Cygnus Finance**](https://cygnus.finance/) - RWA stablecoin
  - Checklist:
    - Load app
    - Connect wallet on 0G if supported
    - Walk the main asset/stablecoin flow until confirmation boundary
    - Report actionable bugs to the dApp channel
    - Log coverage in the Hub only
- [**DataHive**](https://datahive.network/) - personal data economy
  - Checklist:
    - Load app
    - Connect wallet if applicable
    - Walk the main data flow once
    - Report actionable bugs to the dApp channel
    - Log coverage in the Hub only
- [**Khalani**](https://hub.0g.ai/khalani/transfer?network=mainnet) - bridge to 0G
  - Checklist:
    - Load app
    - Connect wallet
    - Walk bridge flow until confirmation screen
    - Report actionable bugs to the dApp channel
    - Do not sign or send
- [**Merkl**](https://app.merkl.xyz/) - claim LIC rewards
  - Checklist:
    - Load app
    - Connect wallet if applicable
    - Walk claim flow until confirmation boundary
    - Report actionable bugs to the dApp channel
    - Do not sign or send

<!-- targets:end -->
