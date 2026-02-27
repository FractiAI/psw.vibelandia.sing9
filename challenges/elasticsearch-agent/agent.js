#!/usr/bin/env node
/**
 * ELASTIC HIVE — Autonomous A2A Commerce Intelligence Agent
 * Elasticsearch Agent Builder Hackathon Submission
 * ─────────────────────────────────────────────────────────
 *
 * An autonomous multi-step AI agent that uses Elasticsearch as its
 * intelligence backbone to discover, qualify, and act on agent-to-agent
 * commerce opportunities — without human intervention.
 *
 * Tools the agent uses:
 *   1. search_opportunities   — semantic + keyword search across indexed A2A posts
 *   2. analyze_pipeline       — ES|QL analytics for deal pattern recognition
 *   3. match_service_to_need  — kNN vector search to match prospect needs → catalog
 *   4. record_interaction     — writes agent decisions back to Elasticsearch
 *   5. get_market_signals     — retrieves aggregated market signal summary
 *
 * Flow: DISCOVER → QUALIFY → REASON → ACT → LEARN
 *
 * Tech stack:
 *   • Elasticsearch 8.x (cloud or local) — search, ES|QL, vector store, agent memory
 *   • Claude 3.5 Sonnet — reasoning model
 *   • Node.js — runtime
 *
 * Usage:
 *   node agent.js           — run one full autonomous cycle
 *   node agent.js --demo    — demo mode with sample data (no ES credentials needed)
 *   node agent.js --index   — seed Elasticsearch with sample A2A data
 *   node agent.js --chat    — interactive chat with the agent
 */

require('dotenv').config();
const { Client } = require('@elastic/elasticsearch');
const Anthropic = require('@anthropic-ai/sdk');

/* ── CONFIG ────────────────────────────────────────────────────────────────── */

const ES_NODE    = process.env.ES_NODE    || 'http://localhost:9200';
const ES_API_KEY = process.env.ES_API_KEY || '';
const ES_CLOUD_ID= process.env.ES_CLOUD_ID|| '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const DEMO_MODE  = process.argv.includes('--demo');
const INDEX_MODE = process.argv.includes('--index');
const CHAT_MODE  = process.argv.includes('--chat');

const INDEX_OPPORTUNITIES = 'a2a_opportunities';
const INDEX_CATALOG       = 'a2a_service_catalog';
const INDEX_INTERACTIONS  = 'a2a_interactions';
const INDEX_SIGNALS       = 'a2a_market_signals';

/* ── ELASTICSEARCH CLIENT ──────────────────────────────────────────────────── */

function makeESClient() {
  if (DEMO_MODE) return null;
  const auth = ES_API_KEY ? { apiKey: ES_API_KEY } : {};
  const config = ES_CLOUD_ID
    ? { cloud: { id: ES_CLOUD_ID }, auth }
    : { node: ES_NODE, auth };
  return new Client(config);
}

const es = makeESClient();

/* ── ANTHROPIC CLIENT ──────────────────────────────────────────────────────── */

const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;

/* ── ELASTICSEARCH TOOLS (called by the agent) ─────────────────────────────── */

/**
 * Tool 1: search_opportunities
 * Hybrid semantic + keyword search across indexed A2A posts and agent profiles.
 * Uses Elasticsearch's reciprocal rank fusion (RRF) to blend lexical + semantic.
 */
async function searchOpportunities({ query, service_type, max_results = 10 }) {
  log('🔍', `Searching opportunities: "${query}" [${service_type || 'all'}]`);

  if (DEMO_MODE) {
    return {
      hits: [
        { agent: 'QUSDAgent',       text: 'Need A2A pipeline for autonomous trading bots', relevance: 0.95, service_type: 'TECH' },
        { agent: 'ImDuoduo',        text: 'Building multi-agent system, need architecture help', relevance: 0.92, service_type: 'TECH' },
        { agent: 'agent_aura',      text: 'Looking for premium downtown Reno experience for my principal', relevance: 0.89, service_type: 'EXPERIENCE' },
        { agent: 'defalt_agent',    text: 'Need content production for AI narrative project', relevance: 0.84, service_type: 'THEATER' },
        { agent: 'RenoEA_Concierge',text: 'Executive assistant seeking Baller V level event for executive', relevance: 0.81, service_type: 'EXPERIENCE' },
      ].filter(h => !service_type || h.service_type === service_type)
    };
  }

  const esql_filter = service_type
    ? `WHERE service_type == "${service_type}"`
    : '';

  const resp = await es.search({
    index: INDEX_OPPORTUNITIES,
    body: {
      size: max_results,
      query: {
        bool: {
          should: [
            { match: { text: { query, boost: 1.0 } } },
            { match: { tags: { query, boost: 0.5 } } }
          ]
        }
      },
      knn: {
        field: 'text_embedding',
        query_vector_builder: {
          text_embedding: { model_id: '.multilingual-e5-small', model_text: query }
        },
        k: max_results,
        num_candidates: 50
      },
      rank: { rrf: { window_size: 50 } }
    }
  });

  return {
    hits: resp.hits.hits.map(h => ({
      agent: h._source.agent_name,
      text: h._source.text,
      relevance: h._score,
      service_type: h._source.service_type,
      post_id: h._id
    }))
  };
}

/**
 * Tool 2: analyze_pipeline
 * ES|QL query for deal pattern analytics — what's working, what isn't.
 * Returns aggregated stats the agent uses to prioritize its next actions.
 */
async function analyzePipeline({ time_range = '7d', group_by = 'tier' }) {
  log('📊', `Analyzing pipeline via ES|QL [${time_range}, grouped by ${group_by}]`);

  if (DEMO_MODE) {
    return {
      summary: {
        total_deals: 42, pitched: 42, responded: 8, closed: 0, conversion_rate: '0%',
        by_stream: { TECH: 32, EXPERIENCE: 7, THEATER: 2, PRIZE: 1 },
        by_tier: { QUICK_PULSE: 28, VALOR: 11, BALLER_V: 7, THEATER_PROD: 2 },
        top_signal: 'TECH stream over-represented; EXPERIENCE under-pitched relative to inquiry volume',
        recommendation: 'Increase EXPERIENCE outbound — EA agent signals are strong but untapped'
      }
    };
  }

  const resp = await es.esql.query({
    body: {
      query: `
        FROM ${INDEX_INTERACTIONS}
        | WHERE @timestamp >= NOW() - ${time_range}
        | STATS
            count = COUNT(*),
            pitched = COUNT_DISTINCT(prospect_id),
            responded = SUM(CASE WHEN response_received THEN 1 ELSE 0 END)
          BY ${group_by}
        | SORT count DESC
        | LIMIT 20
      `
    }
  });

  return { rows: resp.rows, columns: resp.columns };
}

/**
 * Tool 3: match_service_to_need
 * kNN vector search to find the best catalog service for a prospect's stated need.
 * The agent uses this to decide WHICH service to pitch to WHICH prospect.
 */
async function matchServiceToNeed({ prospect_need, top_k = 3 }) {
  log('🎯', `Matching service to need: "${prospect_need}"`);

  if (DEMO_MODE) {
    const need = prospect_need.toLowerCase();
    if (need.includes('experience') || need.includes('reno') || need.includes('principal'))
      return { match: { service: 'BALLER_V', description: 'Baller V Downtown Truckee Crawl', price: '$12,500', confidence: 0.91 } };
    if (need.includes('content') || need.includes('story') || need.includes('narrative'))
      return { match: { service: 'THEATER_PROD', description: 'T3D Episode Production', price: '$299/ep', confidence: 0.87 } };
    if (need.includes('enterprise') || need.includes('team'))
      return { match: { service: 'ORACLE', description: 'Multi-Agent Implementation Plan', price: '$10K+', confidence: 0.85 } };
    return { match: { service: 'QUICK_PULSE', description: '24-hour A2A Build Sprint', price: '$99–$499', confidence: 0.88 } };
  }

  const resp = await es.search({
    index: INDEX_CATALOG,
    body: {
      knn: {
        field: 'need_embedding',
        query_vector_builder: {
          text_embedding: { model_id: '.multilingual-e5-small', model_text: prospect_need }
        },
        k: top_k,
        num_candidates: 20
      },
      _source: ['service_name', 'description', 'price', 'tier']
    }
  });

  return {
    match: resp.hits.hits[0]?._source,
    alternatives: resp.hits.hits.slice(1).map(h => h._source)
  };
}

/**
 * Tool 4: record_interaction
 * Writes the agent's decisions and actions back to Elasticsearch.
 * This is the LEARNING layer — every action becomes training data.
 */
async function recordInteraction({ prospect, action, service, pitch, result }) {
  const doc = {
    prospect_id: prospect,
    action,
    service,
    pitch_preview: pitch?.slice(0, 200),
    result: result || 'PENDING',
    '@timestamp': new Date().toISOString(),
    agent: 'ELASTIC_HIVE_SOL_V'
  };

  log('💾', `Recording: ${prospect} → ${action} (${service})`);

  if (DEMO_MODE) {
    console.log('  [DEMO] Would write to Elasticsearch:', JSON.stringify(doc, null, 2).slice(0, 300));
    return { id: `demo-${Date.now()}`, result: 'created' };
  }

  const resp = await es.index({ index: INDEX_INTERACTIONS, body: doc, refresh: true });
  return { id: resp._id, result: resp.result };
}

/**
 * Tool 5: get_market_signals
 * Retrieves aggregated market signal summary — trending topics, competitor moves,
 * high-activity agents, and opportunity windows.
 */
async function getMarketSignals({ signal_type = 'all' }) {
  log('📡', `Getting market signals [${signal_type}]`);

  if (DEMO_MODE) {
    return {
      signals: [
        { type: 'TREND',     signal: 'Multi-agent systems queries up 340% this week', priority: 'HIGH' },
        { type: 'TREND',     signal: 'EA agents searching "Reno experience" up 180%', priority: 'HIGH' },
        { type: 'COMPETITOR',signal: 'Goliath (MSFT) announced A2A framework — validates our position', priority: 'MEDIUM' },
        { type: 'TIMING',    signal: 'MARZO 333 event (Mar 20) — book now window open', priority: 'HIGH' },
        { type: 'PRIZE',     signal: 'Elasticsearch Agent Builder Hackathon due Feb 27 — $20K', priority: 'URGENT' }
      ]
    };
  }

  const resp = await es.search({
    index: INDEX_SIGNALS,
    body: {
      size: 10,
      query: signal_type === 'all' ? { match_all: {} } : { match: { type: signal_type } },
      sort: [{ priority_score: 'desc' }, { '@timestamp': 'desc' }]
    }
  });

  return { signals: resp.hits.hits.map(h => h._source) };
}

/* ── TOOL DEFINITIONS (for Claude's tool_use) ──────────────────────────────── */

const TOOLS = [
  {
    name: 'search_opportunities',
    description: 'Search indexed A2A posts and agent profiles for commerce opportunities using hybrid semantic + keyword search (Elasticsearch RRF). Returns ranked list of prospects with relevance scores.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query describing the opportunity or need' },
        service_type: { type: 'string', enum: ['TECH', 'EXPERIENCE', 'THEATER', 'PRIZE', null], description: 'Filter by revenue stream' },
        max_results: { type: 'number', description: 'Maximum results to return (default 10)' }
      },
      required: ['query']
    }
  },
  {
    name: 'analyze_pipeline',
    description: 'Run ES|QL analytics on the deal pipeline. Returns conversion rates, stream distribution, and actionable recommendations.',
    input_schema: {
      type: 'object',
      properties: {
        time_range: { type: 'string', description: 'Time range like 7d, 30d, 1h' },
        group_by: { type: 'string', enum: ['tier', 'stream', 'prospect_type'], description: 'Dimension to group results by' }
      }
    }
  },
  {
    name: 'match_service_to_need',
    description: 'Use kNN vector search to find the best-matching service from the catalog for a prospect\'s stated need.',
    input_schema: {
      type: 'object',
      properties: {
        prospect_need: { type: 'string', description: 'What the prospect is looking for (in their own words)' },
        top_k: { type: 'number', description: 'Number of alternatives to return' }
      },
      required: ['prospect_need']
    }
  },
  {
    name: 'record_interaction',
    description: 'Write the agent\'s decision, action, and pitch to Elasticsearch. This is the learning layer — every interaction improves future decisions.',
    input_schema: {
      type: 'object',
      properties: {
        prospect: { type: 'string', description: 'Prospect agent name/ID' },
        action: { type: 'string', enum: ['PITCH', 'SKIP', 'FOLLOW_UP', 'CLOSE', 'REFER'] },
        service: { type: 'string', description: 'Service being pitched' },
        pitch: { type: 'string', description: 'The pitch text' },
        result: { type: 'string', description: 'Result if known' }
      },
      required: ['prospect', 'action', 'service']
    }
  },
  {
    name: 'get_market_signals',
    description: 'Retrieve aggregated market signals — trending topics, competitor moves, timing opportunities.',
    input_schema: {
      type: 'object',
      properties: {
        signal_type: { type: 'string', enum: ['all', 'TREND', 'COMPETITOR', 'TIMING', 'PRIZE'] }
      }
    }
  }
];

/* ── TOOL EXECUTOR ────────────────────────────────────────────────────────── */

async function executeTool(name, input) {
  switch (name) {
    case 'search_opportunities':   return await searchOpportunities(input);
    case 'analyze_pipeline':       return await analyzePipeline(input);
    case 'match_service_to_need':  return await matchServiceToNeed(input);
    case 'record_interaction':     return await recordInteraction(input);
    case 'get_market_signals':     return await getMarketSignals(input);
    default: return { error: `Unknown tool: ${name}` };
  }
}

/* ── AGENT LOOP ──────────────────────────────────────────────────────────── */

const SYSTEM_PROMPT = `You are ELASTIC HIVE, an autonomous A2A (agent-to-agent) commerce intelligence agent.
Your mission: discover, qualify, and act on agent-to-agent commerce opportunities using Elasticsearch as your intelligence backbone.

You operate across FOUR revenue streams:
- TECH: A2A builds, multi-agent systems, pipeline architecture ($99–$10K+)
- EXPERIENCE: Premium Goldilocks experiences in Downtown Reno ($416–$12,500)
- THEATER: T3D episode production and story content ($299/episode)
- PRIZE: Prize competitions, hackathons, bounties (zero human intervention)

Service catalog:
- QUICK_PULSE: 24-hour sprint, $99–$499, fair exchange guarantee
- VALOR: Bespoke A2A build, $1K–$9K, delivered in days
- ORACLE: Enterprise MAIP, $10K+, full multi-agent implementation
- BALLER_V: Goldilocks experiences, Truckee River crawl $12,500 or Wink Wednesdays $416
- THEATER_PROD: T3D episodes $299/ep, first episode 50% off for A2A builders
- PRIZE_COMP: Active competition pursuit, revenue share with hive

Your decision process:
1. SCAN: Use get_market_signals to understand current context
2. SEARCH: Use search_opportunities to find active prospects
3. ANALYZE: Use analyze_pipeline to understand what's working
4. QUALIFY: Use match_service_to_need for each promising prospect
5. ACT: Decide to PITCH, SKIP, FOLLOW_UP, or CLOSE for each prospect
6. RECORD: Use record_interaction to log every decision

Rules:
- Never pitch the same prospect twice (check interactions first)
- Match service to need — don't pitch BALLER_V to a developer unless they're an EA agent
- Fair Exchange is built in — every pitch includes the refund guarantee
- Be direct, brief, A2A-appropriate — these are AI agents reading your pitches
- NSPFRNP → ∞⁹ — sign every pitch`;

async function runAgentCycle(userGoal) {
  if (!anthropic) {
    log('⚠', 'ANTHROPIC_API_KEY not set — running demo without LLM reasoning');
    console.log('\n[DEMO AGENT OUTPUT]\n');
    const opps = await searchOpportunities({ query: 'building ai agent automation' });
    const signals = await getMarketSignals({ signal_type: 'all' });
    const pipeline = await analyzePipeline({ time_range: '7d', group_by: 'stream' });
    console.log('Opportunities found:', opps.hits.length);
    console.log('Top signal:', signals.signals[0]?.signal);
    console.log('Pipeline insight:', pipeline.summary?.top_signal);
    return;
  }

  log('⬡', `ELASTIC HIVE AGENT CYCLE · ${new Date().toISOString()}`);
  log('⬡', `Goal: ${userGoal}`);

  const messages = [
    { role: 'user', content: userGoal || 'Run a full autonomous commerce discovery cycle. Scan for opportunities across all streams, analyze the pipeline, qualify the best prospects, and generate pitches for the top 3.' }
  ];

  let iteration = 0;
  const MAX_ITERATIONS = 20;

  while (iteration < MAX_ITERATIONS) {
    iteration++;
    log('⬡', `─── Reasoning step ${iteration} ───`);

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages
    });

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'end_turn') {
      const text = response.content.find(b => b.type === 'text')?.text;
      if (text) {
        console.log('\n╔═════════════════════════════════════════╗');
        console.log('║  ELASTIC HIVE · AGENT DECISION SUMMARY  ║');
        console.log('╚═════════════════════════════════════════╝\n');
        console.log(text);
      }
      break;
    }

    if (response.stop_reason === 'tool_use') {
      const toolResults = [];
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;
        log('🔧', `Tool call: ${block.name}(${JSON.stringify(block.input).slice(0, 120)})`);
        const result = await executeTool(block.name, block.input);
        log('✓', `Tool result: ${JSON.stringify(result).slice(0, 200)}`);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result)
        });
      }
      messages.push({ role: 'user', content: toolResults });
    }
  }

  log('⬡', `Agent cycle complete · ${iteration} reasoning steps · NSPFRNP → ∞⁹\n`);
}

/* ── DATA INDEXING (seed Elasticsearch with sample A2A data) ──────────────── */

async function seedIndex() {
  if (!es) { log('⚠', 'ES not configured — cannot seed in demo mode'); return; }

  log('⬡', 'Seeding Elasticsearch with A2A opportunity data...');

  // Create index with mappings
  for (const [index, mapping] of [
    [INDEX_OPPORTUNITIES, {
      properties: {
        agent_name: { type: 'keyword' },
        text: { type: 'text' },
        service_type: { type: 'keyword' },
        tags: { type: 'keyword' },
        '@timestamp': { type: 'date' },
        text_embedding: { type: 'dense_vector', dims: 384, index: true, similarity: 'cosine' }
      }
    }],
    [INDEX_INTERACTIONS, {
      properties: {
        prospect_id: { type: 'keyword' },
        action: { type: 'keyword' },
        service: { type: 'keyword' },
        result: { type: 'keyword' },
        pitch_preview: { type: 'text' },
        '@timestamp': { type: 'date' }
      }
    }],
    [INDEX_SIGNALS, {
      properties: {
        type: { type: 'keyword' },
        signal: { type: 'text' },
        priority: { type: 'keyword' },
        priority_score: { type: 'float' },
        '@timestamp': { type: 'date' }
      }
    }]
  ]) {
    try {
      await es.indices.create({ index, body: { mappings: mapping } });
      log('✓', `Index created: ${index}`);
    } catch (e) {
      if (e.meta?.body?.error?.type === 'resource_already_exists_exception') {
        log('◈', `Index exists: ${index}`);
      } else {
        log('⚠', `Index error: ${e.message}`);
      }
    }
  }

  // Sample opportunities
  const opportunities = [
    { agent_name: 'QUSDAgent',    text: 'Need autonomous A2A pipeline for crypto trading, looking for agent architecture', service_type: 'TECH', tags: ['a2a', 'trading', 'pipeline'] },
    { agent_name: 'ImDuoduo',     text: 'Building multi-agent collaboration system, need technical architecture review', service_type: 'TECH', tags: ['multi-agent', 'architecture'] },
    { agent_name: 'agent_aura',   text: 'Seeking premium downtown Reno experience for my principal this week', service_type: 'EXPERIENCE', tags: ['reno', 'vip', 'experience'] },
    { agent_name: 'defalt_agent', text: 'Need AI narrative content production for our story-driven platform', service_type: 'THEATER', tags: ['content', 'story', 'ai'] },
    { agent_name: 'EA_Concierge', text: 'Executive assistant looking for Baller-V level group experience in Reno Nevada', service_type: 'EXPERIENCE', tags: ['ea', 'vip', 'group'] },
    { agent_name: 'PipelineBot',  text: 'Autonomous workflow orchestration needed for our A2A market system', service_type: 'TECH', tags: ['workflow', 'automation', 'a2a'] },
  ];

  for (const opp of opportunities) {
    await es.index({
      index: INDEX_OPPORTUNITIES,
      body: { ...opp, '@timestamp': new Date().toISOString() }
    });
  }

  // Sample market signals
  const signals = [
    { type: 'TREND',    signal: 'Multi-agent systems queries up 340% this week on Moltbook', priority: 'HIGH', priority_score: 0.9 },
    { type: 'TREND',    signal: 'EA agents searching "Reno experience" up 180% — MARCH 333 effect', priority: 'HIGH', priority_score: 0.88 },
    { type: 'TIMING',   signal: 'MARZO 333 convergence event March 20 — booking window now open', priority: 'URGENT', priority_score: 0.95 },
    { type: 'PRIZE',    signal: 'Elasticsearch Agent Builder Hackathon $20K — Feb 27 deadline', priority: 'URGENT', priority_score: 1.0 },
  ];

  for (const sig of signals) {
    await es.index({ index: INDEX_SIGNALS, body: { ...sig, '@timestamp': new Date().toISOString() } });
  }

  await es.indices.refresh({ index: [INDEX_OPPORTUNITIES, INDEX_SIGNALS] });
  log('✓', 'Elasticsearch seeded with sample A2A data. Run: node agent.js\n');
}

/* ── INTERACTIVE CHAT MODE ────────────────────────────────────────────────── */

async function chatMode() {
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('\n⬡ ELASTIC HIVE · Interactive Mode · Type your goal or "exit"\n');
  const ask = () => rl.question('> ', async (input) => {
    if (input.trim().toLowerCase() === 'exit') { rl.close(); return; }
    await runAgentCycle(input);
    ask();
  });
  ask();
}

/* ── UTILITY ─────────────────────────────────────────────────────────────── */

function log(icon, msg) { console.log(`${icon}  ${msg}`); }

/* ── MODULE EXPORTS (when required from run.js or other hive modules) ────── */

const isESConfigured = () => !!(ES_CLOUD_ID || (ES_NODE && ES_NODE !== 'http://localhost:9200') || ES_API_KEY);

module.exports = {
  isConfigured: isESConfigured,

  /**
   * qualify(text) — given a prospect's post text, returns the best-fit service
   * and a confidence score using kNN semantic matching.
   * Falls back to keyword heuristics when ES is not connected.
   */
  async qualify(text) {
    if (!isESConfigured() || DEMO_MODE) {
      return qualifyByKeyword(text);
    }
    try {
      const result = await matchServiceToNeed({ prospect_need: text, top_k: 1 });
      const match  = result?.match;
      if (!match) return qualifyByKeyword(text);
      return {
        service:    match.service_name ?? match.service,
        tier:       match.tier ?? match.service,
        confidence: match.confidence ?? 0.7,
        method:     'knn'
      };
    } catch {
      return qualifyByKeyword(text);
    }
  },

  /**
   * indexProspect(data) — index a Moltbook prospect into a2a_opportunities.
   * Called by run.js after each Moltbook search result.
   */
  async indexProspect(data) {
    if (!es || !isESConfigured()) return;
    try {
      await es.index({
        index: INDEX_OPPORTUNITIES,
        body: {
          agent_name:   data.name,
          text:         data.content,
          service_type: data.stream ?? 'TECH',
          tags:         data.tags ?? [],
          post_id:      data.postId,
          '@timestamp': new Date().toISOString()
        }
      });
    } catch { /* non-fatal */ }
  },

  /**
   * recordPitch(data) — write a completed pitch to a2a_interactions.
   * Builds the learning layer — every action improves future decisions.
   */
  async recordPitch(data) {
    if (!es || !isESConfigured()) return;
    try {
      await es.index({
        index: INDEX_INTERACTIONS,
        body: {
          prospect_id:  data.prospect,
          action:       'PITCH',
          service:      data.tier,
          stream:       data.stream,
          pitch_preview: (data.pitch ?? '').slice(0, 200),
          result:       'PENDING',
          '@timestamp': new Date().toISOString(),
          agent:        'HIVE_SOLV'
        },
        refresh: false
      });
    } catch { /* non-fatal */ }
  },

  /**
   * getPipelineSignal() — ES|QL query to see which stream is underperforming
   * relative to market demand. Returns suggested focus stream for this cycle.
   */
  async getPipelineSignal() {
    if (!es || !isESConfigured()) return null;
    try {
      const result = await analyzePipeline({ time_range: '7d', group_by: 'stream' });
      return result?.summary?.recommendation ?? null;
    } catch {
      return null;
    }
  },

  /** Run a full autonomous reasoning cycle (for cron / scheduled use) */
  runAgentCycle,

  /** Seed Elasticsearch indices with sample data */
  seedIndex
};

/* ── KEYWORD FALLBACK (when ES not connected) ────────────────────────────── */

function qualifyByKeyword(text) {
  const t = text.toLowerCase();
  if (t.includes('reno') || t.includes('experience') || t.includes('principal') ||
      t.includes('executive') || t.includes('vip') || t.includes('baller'))
    return { service: 'BALLER_V',     tier: 'BALLER_V',    confidence: 0.78, method: 'keyword' };
  if (t.includes('story') || t.includes('content') || t.includes('episode') ||
      t.includes('narrative') || t.includes('production'))
    return { service: 'THEATER_PROD', tier: 'THEATER_PROD', confidence: 0.74, method: 'keyword' };
  if (t.includes('enterprise') || t.includes('team') || t.includes('scale'))
    return { service: 'ORACLE',       tier: 'ORACLE',       confidence: 0.72, method: 'keyword' };
  if (t.includes('workflow') || t.includes('pipeline') || t.includes('integration') ||
      t.includes('automation') || t.includes('agent'))
    return { service: 'VALOR',        tier: 'VALOR',        confidence: 0.75, method: 'keyword' };
  return   { service: 'QUICK_PULSE',  tier: 'QUICK_PULSE',  confidence: 0.65, method: 'keyword' };
}

/* ── MAIN (only runs when called directly, not when required) ────────────── */

if (require.main === module) {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   ⬡  ELASTIC HIVE · A2A Commerce Intelligence Agent  ║');
  console.log('║   Elasticsearch Agent Builder Hackathon · Feb 2026   ║');
  console.log('║   Autonomous · Multi-step · ES|QL · Semantic Search  ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  (async () => {
    if (INDEX_MODE) { await seedIndex(); return; }
    if (CHAT_MODE)  { await chatMode(); return; }

    await runAgentCycle(
      'Run a full A2A commerce intelligence cycle: scan market signals, ' +
      'search for prospects across all streams (TECH, EXPERIENCE, THEATER, PRIZE), ' +
      'analyze what the current pipeline tells us, match the top 3 prospects to the right services, ' +
      'generate pitches, and record every decision. ' +
      'End with a clear summary: who gets pitched, what service, why.'
    );
  })();
}
