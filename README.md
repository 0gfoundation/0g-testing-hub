# 0g-testing-hub

**0g-testing-hub** is a testing program for 0G Ecosystem: complete the required L0 surveys, test target apps, file reproducible bugs through Submit Feedback, and climb **L0-L3** for 0G Compute Credit. **Not a code project** - no build, test, or package manager here.

## Jump to

- [Test, Report, Reward](#test-report-reward)
- [Tester Path](#tester-path)
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

1. **[Sign up][signup-link]** once with your public 0G mainnet wallet. Keep the default title; the issue is your tracker.
2. **Clear L0** by completing both surveys in the table above. No bug is required for L0.
3. **Test core targets first:** 0G App Suite for L1, then 0G Infra for L2/L3. Ecosystem dApps are useful coverage, but not core reward gates.
4. **Submit one item at a time** with [Submit Feedback](https://github.com/0gfoundation/0g-testing-hub/issues/new?template=submit-feedback.yml). For bugs, include steps, expected result, actual result, and evidence. Then wait for maintainer triage.

Before filing, [search existing reports](https://github.com/0gfoundation/0g-testing-hub/issues?q=is%3Aissue%20label%3Afeedback). Duplicates credit the first reporter.

**Reward notes / out of bounds:**

- **Duplicates** or **not-reproducible** "felt off" reports.
- **Feature requests** - welcome under Category `Feature Request`, but recorded only, never rewarded (unless the docs already promised the behavior — then it's a bug).
- **Cosmetic-only reports** with no reproducible functional impact.
- **Ecosystem dApps** - welcome as ecosystem coverage, but prioritize 0G App Suite and 0G Infra if you are aiming for higher rewards. Also report actionable dApp bugs to the dApp's own channel and paste the link as a comment.
- **Funds / keys** - never sign or send; stop at the transaction-confirmation screen on swap / bridge / faucet / sign flows.

## Test Targets

<!-- targets:start -->

Test the core user flow for each target, including one happy path and one error path. File reproducible DX friction: confusing setup, unclear errors, broken docs, wallet/network issues, blocked flows, or behavior that diverges from what the product promises.

### 0G App Suite · core (L0-L1)

- [**0G App**](https://app.0g.ai/) - flagship app builder, live on mainnet
- [**Genome**](https://app.0g.ai/genome) - paste a URL/screenshot, produces production-grade design DNA
- [**0G Chat**](https://app.0g.ai/private-chat) - end-to-end encrypted private chat (UI still WIP)
- [**Agent launchpad**](https://app.0g.ai/agent-launchpad) - agent launchpad + skill marketplace (Hermes + OpenClaw harness)

### 0G Infra · core (L2)

- [**0G Hub**](https://hub.0g.ai/) - bridge / swap / faucet / portfolio
- [**0G Storage Scan**](https://storagescan-newton.0g.ai/) - storage explorer
- [**Chain Scan**](https://chainscan.0g.ai/) - block explorer
- [**0G Code to Coin (0g-cc)**](https://www.npmjs.com/package/@0gfoundation/0g-cc) - MCP server for AI inference / storage on 0G Compute
  - Note: `0g-cc` is a CLI / MCP server, not a web app. Add it (`claude mcp add 0g-cc npx @0gfoundation/0g-cc`), then walk one inference / storage flow plus one error path. The funds/keys boundary still applies.

### 0G Ecosystem dApp

- [**Zia**](https://tradegpt.finance/) - natural language DEX on 0G
- [**Jaine**](https://jaine.fi/) - DEX/liquidity (LIC)
- [**Oku**](https://oku.trade/) - concentrated liquidity DEX
- [**AI Arena**](https://aiarena.io/) - PvP, train AI agents
- [**CARV**](https://carv.io/) - gamer identity
- [**Cygnus Finance**](https://cygnus.finance/) - RWA stablecoin
- [**DataHive**](https://datahive.network/) - personal data economy

<!-- targets:end -->

[signup-link]: https://github.com/0gfoundation/0g-testing-hub/issues/new?title=%5Bsignup%5D%3A%20tester%20registration&labels=signup&body=%23%23%23%200G%20mainnet%20EVM%20wallet%20address%0A%0AReplace%20this%20line%20with%20your%20public%200x%20wallet%20address.%0A%0ADo%20not%20paste%20a%20private%20key%2C%20seed%20phrase%2C%20or%20any%20secret.%0A%0A---%0A%0A%23%23%23%20Before%20you%20click%20Create%0A%0A-%20Keep%20the%20title%20as%20%60%5Bsignup%5D%3A%20tester%20registration%60%3B%20the%20bot%20will%20rename%20it%20to%20your%20GitHub%20username.%0A-%20Check%20that%20the%20wallet%20above%20is%20your%20public%200x%20address.%0A-%20Click%20**Create**%20to%20submit%20this%20signup%20issue.%0A%0A%23%23%23%20What%20happens%20next%0A%0A-%20The%20bot%20validates%20your%20wallet%20and%20comments%20here.%0A-%20Complete%20the%20%5B0G%20Studio%20Survey%5D(https%3A%2F%2Fforms.gle%2FymEdZrdTNs4giEm1A).%0A-%20Complete%20the%20%5B0G%20Private%20Computer%20Survey%5D(https%3A%2F%2Fforms.gle%2FG919xrbRyfVJxPZe8).%0A-%20When%20%60l0%3Acleared%60%20appears%2C%20L0%20is%20done%3A%20**10%200G%20Compute%20Credit**.%0A-%20After%20L0%2C%20use%20%5BSubmit%20Feedback%5D(https%3A%2F%2Fgithub.com%2F0gfoundation%2F0g-testing-hub%2Fissues%2Fnew%3Ftemplate%3Dsubmit-feedback.yml)%20for%20reproducible%20App%20Suite%20bugs%20toward%20L1.%0A%0A%23%23%23%20How%20to%20track%20progress%0A%0A-%20This%20sign-up%20issue%20tracks%20L0%20and%20reward%20progress.%0A-%20Each%20feedback%20issue%20shows%20triage%20labels%20and%20bot%20comments%20after%20maintainer%20review.%0A-%20%60feedback%60%3A%20received.%0A-%20%60defect%60%20%2B%20%60status%3Afiled%60%3A%20bug%20entered%20triage.%0A-%20%60status%3Aneeds-info%60%3A%20reply%20with%20more%20detail.%0A-%20%60status%3Aaccepted%60%3A%20confirmed%3B%20counts%20for%20rewards%20when%20it%20is%20a%20core%20App%20Suite%20%2F%200G%20Infra%20bug.%0A-%20%60status%3Arouted%60%3A%20sent%20upstream%3B%20still%20counts%20if%20rewardable.%0A-%20%60status%3Aclosed%60%20%2B%20%60resolution%3A*%60%3A%20fixed%20keeps%20credit%3B%20rejected%2Fduplicate%20do%20not.%0A
