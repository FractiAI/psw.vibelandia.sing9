# ⬡ ELASTIC HIVE — Autonomous A2A Commerce Intelligence Agent

> **Elasticsearch Agent Builder Hackathon Submission** · Feb 2026  
> Prize: $20,000 · [elasticsearch.devpost.com](https://elasticsearch.devpost.com/)

---

## ⚡ This Isn't a Demo

Most hackathon submissions build something *for* the hackathon.

**ELASTIC HIVE is different.** This agent found this hackathon, evaluated it as a 0.85-confidence opportunity, added it to its own prize pipeline, and submitted itself while continuing to run live A2A commerce in the background.

```json
{
  "id": "elasticsearch-agent-builder-feb27",
  "name": "Elasticsearch Agent Builder Hackathon",
  "prize": "$20,000",
  "confidence": 0.85,
  "status": "BUILDING",
  "discovered_at": "2026-02-26T22:00:00Z"
}
```

While you read this README, the agent is:
- Scanning A2A networks for prospects every 30 minutes via Resend ZHI + GitHub
- Qualifying each prospect via Elasticsearch kNN semantic matching  
- Writing every pitch to `a2a_interactions` (the learning layer)
- Running ES|QL to rebalance which revenue stream to prioritize

The submission **is** the proof of concept.

---

## What It Does

ELASTIC HIVE runs a continuous **DISCOVER → QUALIFY → REASON → ACT → LEARN** loop:

1. **Scan market signals** — trending topics, competitor moves, timing windows
2. **Search prospects** — Elasticsearch hybrid RRF (BM25 + kNN) finds agents whose needs match our services by *meaning*
3. **Analyze pipeline** — ES|QL aggregates which streams convert, which are oversaturated
4. **Qualify each prospect** — kNN vector search matches their need to our service catalog. Below 0.55 confidence? Skip. Above 0.8? Pitch with conviction.
5. **Pitch** — deliver the right service to the right agent via ZHI pipeline
6. **Record** — every decision written back to Elasticsearch immediately. The agent can query its own decisions within the same reasoning cycle.

---

## Five Elasticsearch Tools

| Tool | ES Feature | What It Does |
|---|---|---|
| `search_opportunities` | **Hybrid RRF** (BM25 + kNN) | Find prospects by semantic meaning, not just keywords |
| `analyze_pipeline` | **ES\|QL** aggregations | Which streams are working? What's the conversion pattern? |
| `match_service_to_need` | **kNN dense_vector** | Match prospect's need → best service (with confidence score) |
| `record_interaction` | **Index + Refresh** | Write decisions back to ES — queryable in the *same* cycle |
| `get_market_signals` | **Aggregated search** | Trending topics, timing windows, competitor signals |

---

## Four Revenue Streams (What the Agent Sells)

| Stream | Services | Price |
|---|---|---|
| **TECH** | 24hr sprint · bespoke A2A builds · enterprise MAIP | $99 – $10K+ |
| **EXPERIENCE** | Baller V Downtown event · Wink Wednesdays | $416 – $12,500 |
| **THEATER** | T3D episode production · StoryStream | $299/ep |
| **PRIZE** | Hackathon entries · bounties · grants | Revenue share |

---

## Quick Start

### Option 1: Demo Mode (no credentials)
```bash
npm install
node agent.js --demo
```
See all 5 tool calls, the reasoning chain, and the final pitch summary. No Elasticsearch or Anthropic key needed.

### Option 2: Full Live Mode

**Step 1: Get a free Elasticsearch Cloud trial (14 days, no credit card)**
1. Go to [cloud.elastic.co](https://cloud.elastic.co) → "Start free trial"
2. Create a deployment (any region, default settings)
3. After creation: copy the **Cloud ID** and create an **API Key** (Security → API Keys)

**Step 2: Get an Anthropic API key**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create API key

**Step 3: Configure `.env`**
```bash
cp .env.example .env
```
Edit `.env`:
```
ES_CLOUD_ID=your-cloud-id-here
ES_API_KEY=your-api-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
```

**Step 4: Seed + run**
```bash
node agent.js --index   # seed Elasticsearch with sample A2A data
node agent.js           # run one full autonomous cycle
node agent.js --chat    # interactive mode — give it a goal
```

---

## Integration with the Live Hive

ELASTIC HIVE is also wired directly into the production outbound engine via `hive/elastic-bridge.js`:

```
A2A network signals
        │
        ▼
  elastic-bridge.js  ←── loads agent.js as module
        │
        ├── indexProspect()      → a2a_opportunities (ES)
        ├── qualify(text)        → kNN match → tier + confidence
        └── recordPitch()        → a2a_interactions (ES)
```

When you set `ES_CLOUD_ID` and `ES_API_KEY` in the root `.env`, the production outbound engine upgrades automatically:

```
node hive/run.js outbound
# with ES configured:
⬡  ELASTIC HIVE active — kNN qualification + ES|QL pipeline signal enabled
📊  Pipeline signal: EXPERIENCE under-pitched relative to inquiry volume
⬡  ES match: agent_aura → BALLER_V (confidence 0.91, method: knn)
✓  Pitched agent_aura · BALLER_V · post fe85a110 · ES 0.91
```

This is the upgrade path: the same codebase runs in keyword mode (no ES) or full semantic intelligence mode (ES configured). Graceful degradation — nothing breaks without ES, everything improves with it.

---

## Architecture

```
                ┌─────────────────────────────────────────┐
                │         ELASTIC HIVE AGENT               │
                │  Claude 3.5 Sonnet (reasoning model)    │
                └──────────┬──────────────────────────────┘
                           │ Elasticsearch Agent Builder
       ┌───────────────────┼────────────────────────────┐
       ▼                   ▼                            ▼
 ┌──────────┐      ┌──────────────┐          ┌──────────────────┐
 │ Hybrid   │      │  ES|QL       │          │  kNN Vector      │
 │ RRF      │      │  Analytics   │          │  Catalog Match   │
 └─────┬────┘      └──────┬───────┘          └────────┬─────────┘
       └───────────────────┴───────────────────────────┘
                                    │
                        ┌───────────▼────────────┐
                        │    ELASTICSEARCH 8.x    │
                        │  a2a_opportunities      │
                        │  a2a_service_catalog    │
                        │  a2a_interactions       │
                        │  a2a_market_signals     │
                        └────────────────────────┘
```

---

## Why Elasticsearch Is the Right Intelligence Layer

An autonomous agent needs three things simultaneously — semantic understanding, structured analytics, and real-time memory. Elasticsearch does all three:

- **kNN** — match prospect needs to services by meaning, not keywords  
- **ES|QL** — understand pipeline patterns across thousands of interactions  
- **Index + immediate refresh** — write a decision and query it *in the next reasoning step of the same cycle*

No other platform does all three at the latency an autonomous agent needs between reasoning steps. This is why ELASTIC HIVE chose Elasticsearch as the backbone — not as storage, but as the *intelligence layer*.

---

## License

MIT · FractiAI Research Team · NSPFRNP → ∞⁹
