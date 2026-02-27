# ⬡ SING!9 PRIZE STREAM — ZERO HUMAN INTERVENTION
# One-time setup only. Agent does everything else.
# Updated: 2026-02-27
#
# POLICY: HIGH-MATCH ONLY
# We only attempt bounties that pass both gates:
#   Gate 1 (metadata pre-filter): match score ≥ 0.70
#   Gate 2 (LLM feasibility):     Claude score ≥ 0.82  (was 0.65)
#   Min bounty:                    $500                 (was $100)
# Zero submissions in a cycle is a valid, correct outcome.
# Quality over quantity. One strong PR beats ten weak ones.

---

## ONE-TIME SETUP (do this once, never again)

```
# .env
GITHUB_TOKEN=ghp_...               ← github.com/settings/tokens (repo + workflow scopes)
ANTHROPIC_API_KEY=sk-ant-...       ← console.anthropic.com
WALLET_ADDRESS=0x...               ← your ETH/USDC wallet (MetaMask, Coinbase, etc.)
PAYOUT_EMAIL=you@email.com         ← for platforms that pay USD via PayPal/bank
MIN_BOUNTY_USD=500                 ← high-match floor (was 100)
MATCH_THRESHOLD=0.70               ← metadata pre-filter gate (new)
FEASIBILITY_THRESHOLD=0.82         ← LLM deep-read gate (was 0.65)
```

After setup: `node hive/run.js solve` — runs the full loop.
Scheduled automatically: 6am / 12pm / 6pm / midnight via schedule-hive.ps1.

---

## HOW IT WORKS (zero human after setup)

```
SOLVER CYCLE (4x daily):
  1. Fetch open bounties — Algora API + IssueHunt API + Gitcoin API
  2. Filter — JS/TS/Python · ≥$100 · GitHub issue · not already attempted
  3. Claude assesses — reads issue + code · scores feasibility 0-1
  4. If score ≥ 0.65 → Claude writes the fix
  5. GitHub API — fork repo → create branch → commit files → open PR
  6. Payment auto-releases when PR is merged
  7. LATTICE updated with submission status + PR URL
```

No human touches anything. Not even to review. The agent decides, builds, and submits.

---

## ACTIVE TARGETS

### CODING BOUNTIES (highest confidence — runs via cmdSolve)

| Platform | How | Prize | Confidence |
|---|---|---|---|
| **Algora.io** | Fetch API → Claude fixes issue → GitHub PR → auto-pay on merge | $100–$25K | 95% |
| **IssueHunt** | Fetch API → Claude writes fix → GitHub PR → USD payout | $100–$10K | 93% |
| **Gitcoin Bounties** | Fetch API → Claude fixes → GitHub PR → ETH/USDC to wallet | $100–$50K | 90% |
| **NEAR Protocol** | NEAR ecosystem issues → fix → PR → NEAR tokens to wallet | $1K–$50K | 74% |

### BUG BOUNTIES (automated security analysis)

| Platform | How | Prize | Confidence |
|---|---|---|---|
| **Immunefi** | API scan → critical finding → API submit → crypto to wallet | $10K–$10M | 70% |
| **Code4Arena** | API join → Solidity review → findings report → pool share | $10K–$250K | 65% |
| **Cantina** | AI-friendly → findings API → crypto payout | $5K–$500K | 65% |
| **HackerOne** | Public paid programs only → H1 API submit → wallet | $100–$50K | 60% |

### GRANTS (programmatic submission)

| Platform | How | Prize | Confidence |
|---|---|---|---|
| **Gitcoin Grants** | Submit SING9 as OSS public good → community donates → quadratic match → wallet | $500–$500K | 72% |

### PREDICTION MARKETS (pure signal → position → settle)

| Platform | How | Prize | Confidence |
|---|---|---|---|
| **Polymarket** | ECHO signal analysis → agent positions → Polygon auto-settlement | variable | 62% |
| **Manifold Markets** | Forecasting → agent predicts → Mana → USD payout | Mana→USD | 58% |

---

## ELIMINATED — WRONG LANGUAGE (hard disqualifiers)

The following were removed from PRIORITY_TARGETS because they require languages
outside our stack (Rust, Go, etc.). metadataMatchScore returns 0 for these.

- ~~Golem CLI MCP #275~~ ($3,500 · **Rust** — hard disqualifier)

---

## ELIMINATED — REQUIRED HUMAN INTERVENTION

The following were removed from the pipeline. They all require one or more of:
demo video recording, clicking a DevPost submission form, human judge review
with no programmatic submission path.

- ~~Elasticsearch Agent Builder Hackathon~~ (DevPost submit + demo video)
- ~~Amazon Nova AI Hackathon~~ (DevPost submit + demo video)
- ~~Gemini Live Agent Challenge~~ (DevPost submit + demo video)
- ~~GitLab AI Hackathon~~ (DevPost submit + demo video)
- ~~DigitalOcean Gradient AI~~ (DevPost submit + demo video)
- ~~Airia AI Agents Hackathon~~ (DevPost submit + demo video)
- ~~Fetch.ai Hackathon~~ (devpost submit)
- ~~SingularityNET AI Challenge~~ (devpost submit)
- ~~Replit Bounties~~ (platform deprecated Feb 2026)

---

## COMMANDS

```bash
node hive/run.js solve    # run one full solver cycle right now
node hive/run.js prize    # scan + update prize pipeline
node hive/run.js revenue  # full cycle: broadcast + outbound + prize + solve
```

→ ∞⁹ · FractiAI Research Team · NSPFRNP
