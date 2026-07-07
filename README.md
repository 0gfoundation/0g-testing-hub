# 0g-testing-hub

**0g-testing-hub** is a testing program for 0G Ecosystem: complete the required L0 surveys, test target apps, file reproducible bugs through Submit Feedback, and climb **L0-L3** for 0G Compute Credit. **Not a code project** - no build, test, or package manager here.

## Jump to

- [Test, Report, Reward](#test-report-reward)
- [Tester Path](#tester-path)
- [Track your report by its labels](#track-your-report-by-its-labels)
- [Test Targets](#test-targets)

## Test, Report, Reward

![Reward workflow](./Assets/reward-workflow.png)

![Reward levels](./Assets/reward-level.png)

All rewards are **0G Compute Credit**; payout = the Credit of your **highest level reached** (not cumulative).

| Reach | How it clears | Where to go | Credit |
|-------|---------------|-------------|:------:|
| **Sign Up** | Register with your 0G mainnet wallet (your GitHub account is your identity) | [Sign up (GitHub)][signup-link] | — |
| **L0** Recruit | 2 required surveys; no bug required | 1. [0G Studio Survey (App Suite, all four apps)](https://forms.gle/ymEdZrdTNs4giEm1A)<br>2. [0G Private Computer Survey](https://forms.gle/G919xrbRyfVJxPZe8) | **10 0G Compute Credit** |
| **L1** Tester | 1 accepted · App Suite | [Submit Feedback form](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=submit-feedback.yml) | **20 0G Compute Credit** |
| **L2** Infra Pioneer | +1 accepted · 0G Infra (2 total) | [Submit Feedback form](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=submit-feedback.yml) | **40 0G Compute Credit** |
| **L3** Master | 5+ accepted · App Suite + 0G Infra | [Submit Feedback form](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=submit-feedback.yml) | **100 0G Compute Credit** |

## Tester Path

Focus on the tester side: register once from this README, complete the L0 surveys, test the targets, and submit one clear feedback item at a time with enough detail to reproduce.

1. **[Sign up][signup-link]** once — this registration issue is your tracker and the start of your tester journey.
2. **Clear L0** — complete the two surveys above with that same GitHub username. No bug needed → **10 0G Compute Credit**.
3. **Pick a target** — prioritize **0G App Suite** first, then **0G Infra**. They are the core L1–L3 reward path, so accepted bugs there unlock the higher rewards. Ecosystem dApps are also welcome as ecosystem coverage.
4. **Submit one feedback item at a time** — from L1 upward, open **[Submit Feedback](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=submit-feedback.yml)** for each bug, feature request, or other note. Pick **Category** and **Product**, then use **Details** for steps, expected result, and actual result. Add screenshots, recordings, or links in **Evidence** when useful.
5. **Follow your tracker** — your sign-up issue shows L0 status and reward-progress previews as accepted core bug reports move you through **L1–L3**. `Feature Request` and `Other` are recorded but do not count toward rewards; Ecosystem dApp findings are useful coverage, while L1–L3 rewards come from accepted App Suite / 0G Infra bugs.

### Track your report by its labels

The labels on your feedback issue tell you exactly where it stands — no need to ask. A bot also comments on your issue at every status change, explaining what it means for your reward. Full guide: [docs/LABELS.md](./docs/LABELS.md).

| Label | What it means for you |
|-------|-----------------------|
| `feedback` | Received through the Submit Feedback form |
| `defect` + `status:filed` | Your Bug Report entered triage — a maintainer will try to reproduce it |
| `status:needs-info` | **Your move** — triage needs more detail; reply within ~7 days or it closes as rejected |
| `status:accepted` | Confirmed and reproducible — **this is what counts toward your reward** |
| `status:routed` | Sent to the owning team — still counts toward your reward |
| `status:closed` + `resolution:*` | The resolution label says why: `fixed` (real bug, resolved — **keeps its credit**), `rejected` (not counted), `duplicate` (credit goes to the first reporter) |
| `needs:dapp-report-url` | **Your move** — comment the dApp's own report/support link on your ecosystem bug |
| `area:*` / `product:*` / `sev:P1`–`P4` | Product family, product, and severity — assigned by maintainers/automation, not by you |

**Tip — check before you file:** duplicates credit the first reporter, so filter
[open issues by `product:*`](https://github.com/0gfoundation/0g-testing-hub/issues?q=is%3Aissue+label%3A%22product%3A0g-app%22) (e.g. `label:"product:0g-chat"`) to see whether your bug is already reported.

**Reward notes / out of bounds:**

- **Duplicates** or **not-reproducible** "felt off" reports.
- **Feature requests** - welcome under Category `Feature Request`, but recorded only, never rewarded (unless the docs already promised the behavior — then it's a bug).
- **P4 cosmetics** with no reproducible P1/P2.
- **Ecosystem dApps** - welcome as ecosystem coverage, but prioritize 0G App Suite and 0G Infra if you are aiming for higher rewards. Also report actionable dApp bugs to the dApp's own channel and paste the link as a comment.
- **Funds / keys** - never sign or send; stop at the transaction-confirmation screen on swap / bridge / faucet / sign flows.

## Test Targets

<!-- targets:start -->

### 0G App Suite · core (L0-L1)

- [**0G App**](https://app.0g.ai/) - flagship app builder, live on mainnet
- [**Genome**](https://dev.0g-vibe.pages.dev/genome) - paste a URL/screenshot, produces production-grade design DNA
- [**0G Chat**](https://dev.0g-vibe.pages.dev/private-chat) - end-to-end encrypted private chat (UI still WIP)
- [**PandaClaw**](https://dev.0g-vibe.pages.dev/agents) - agent launchpad + skill marketplace (Hermes + OpenClaw harness)

### 0G Infra · core (L2)

- [**0G Hub**](https://hub.0g.ai/) - bridge / swap / faucet / portfolio
- [**0G Storage Scan**](https://storagescan-newton.0g.ai/) - storage explorer
- [**Chain Scan**](https://chainscan.0g.ai/) - block explorer
- [**0G Code to Coin (0g-cc)**](https://www.npmjs.com/package/@0gfoundation/0g-cc) - MCP server for AI inference / storage on 0G Compute
  - Note: `0g-cc` is a CLI / MCP server, not a web app. Add it (`claude mcp add 0g-cc npx @0gfoundation/0g-cc`), then walk one inference / storage flow plus one error path. The funds/keys boundary still applies.

### 0G Ecosystem dApp

- [**TradeGPT**](https://tradegpt.finance/) - AI-driven DEX
- [**Jaine**](https://jaine.fi/) - DEX/liquidity (LIC)
- [**Oku**](https://oku.trade/) - concentrated liquidity DEX
- [**AI Arena**](https://aiarena.io/) - PvP, train AI agents
- [**CARV**](https://carv.io/) - gamer identity
- [**Cygnus Finance**](https://cygnus.finance/) - RWA stablecoin
- [**DataHive**](https://datahive.network/) - personal data economy
- [**Khalani**](https://hub.0g.ai/khalani/transfer?network=mainnet) - bridge to 0G
- [**Merkl**](https://app.merkl.xyz/) - claim LIC rewards

<!-- targets:end -->

[signup-link]: https://github.com/0gfoundation/0g-testing-hub/issues/new?title=%5Bsignup%5D%3A%20&labels=signup&body=%23%23%23%200G%20mainnet%20EVM%20wallet%20address%0A%0APaste%20your%20public%200x%20wallet%20address%20here.%0A%0ANever%20paste%20a%20private%20key%20or%20seed%20phrase.
