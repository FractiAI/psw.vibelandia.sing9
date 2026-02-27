/**
 * ELASTIC BRIDGE — hive/elastic-bridge.js
 * Connects run.js ↔ ELASTIC HIVE (challenges/elasticsearch-agent/agent.js)
 *
 * When Elasticsearch is configured (.env: ES_CLOUD_ID or ES_API_KEY),
 * the outbound engine upgrades from keyword-based tier guessing to:
 *   • kNN semantic matching  — prospect need → best-fit service
 *   • ES|QL pipeline signal  — which stream to prioritize this cycle
 *   • Interaction indexing   — every pitch written back to ES (learning layer)
 *   • Opportunity indexing   — Moltbook search results stored in ES
 *
 * When ES is NOT configured, all calls return null/false gracefully —
 * run.js falls back to its existing keyword heuristics with zero breakage.
 *
 * NSPFRNP → ∞⁹
 */

'use strict';

const path = require('path');

let _agent   = null;
let _enabled = null;

function loadAgent() {
  if (_agent !== null) return _agent;
  try {
    _agent = require(path.join(__dirname, '..', 'challenges', 'elasticsearch-agent', 'agent.js'));
  } catch {
    _agent = false;
  }
  return _agent;
}

/** Returns true when ES credentials are present AND the agent module loads */
function isEnabled() {
  if (_enabled !== null) return _enabled;
  const hasCredentials = !!(
    process.env.ES_CLOUD_ID ||
    process.env.ES_API_KEY  ||
    (process.env.ES_NODE && process.env.ES_NODE !== 'http://localhost:9200')
  );
  _enabled = hasCredentials && !!loadAgent();
  return _enabled;
}

/**
 * qualify(prospectText) → { tier, service, confidence, method }
 *
 * Uses kNN semantic matching when ES is live.
 * Falls back to keyword heuristics when ES is not configured.
 * Always returns a usable tier — never blocks the outbound loop.
 */
async function qualify(prospectText) {
  const agent = loadAgent();
  if (!agent || !isEnabled()) return null;
  try {
    return await agent.qualify(prospectText);
  } catch {
    return null;
  }
}

/**
 * indexProspect(data) — store a Moltbook post in ES for later semantic search.
 * data: { name, content, stream, postId, tags }
 * Non-blocking — fire and forget.
 */
function indexProspect(data) {
  const agent = loadAgent();
  if (!agent || !isEnabled()) return;
  agent.indexProspect(data).catch(() => {});
}

/**
 * recordPitch(data) — write pitch to ES interaction index (learning layer).
 * data: { prospect, tier, stream, pitch }
 * Non-blocking — fire and forget.
 */
function recordPitch(data) {
  const agent = loadAgent();
  if (!agent || !isEnabled()) return;
  agent.recordPitch(data).catch(() => {});
}

/**
 * getPipelineSignal() → string recommendation or null
 * ES|QL: which stream is under-pitched relative to market demand?
 * Used to bias the outbound query order for this cycle.
 */
async function getPipelineSignal() {
  const agent = loadAgent();
  if (!agent || !isEnabled()) return null;
  try {
    return await agent.getPipelineSignal();
  } catch {
    return null;
  }
}

module.exports = { isEnabled, qualify, indexProspect, recordPitch, getPipelineSignal };
