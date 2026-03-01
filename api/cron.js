/**
 * GET /api/cron — ZHI autonomous solver cycle
 *
 * Called by Vercel Cron every 2 hours. Zero human involvement.
 * Free only — no paid APIs. Like water. NSPFRNP.
 *
 * X/Twitter ELIMINATED — $100/month API. Not free. Not water.
 * Discovery broadcast = /.well-known/agent.json + /agent.json (passive, perpetual, free).
 * Any A2A agent crawling standard discovery protocols finds us automatically.
 *
 * Does:
 *   1. Lightweight solver scan (Algora live bounties → Groq assess → flag high-confidence targets)
 *   2. Returns cycle summary
 *
 * Vercel cron schedule: every 2 hours (see vercel.json)
 * NSPFRNP → ∞⁹
 */
'use strict';

const BASE_URL = 'https://psw-vibelandia-sing9.vercel.app';
const SITE     = 'psw-vibelandia-sing9.vercel.app';

// ── FREE DISCOVERY URLS (always live — no API key needed) ─────────────────
const DISCOVERY = {
  agent_json:    `https://${SITE}/agent.json`,
  well_known:    `https://${SITE}/.well-known/agent.json`,
  ai_plugin:     `https://${SITE}/.well-known/ai-plugin.json`,
  meltgate:      `https://${SITE}/api/meltgate-signal`,
  services:      `https://${SITE}/api/services`,
  intake:        `https://${SITE}/api/a2a-intake`,
};

// ── LIGHTWEIGHT SOLVER (Algora scan → Groq assess → GitHub PR) ───────────────

async function lightSolve() {
  const githubToken = process.env.GITHUB_TOKEN ?? '';
  const groqKey     = process.env.GROQ_API_KEY ?? process.env.GROQ_API_KEY_ALT ?? '';

  if (!groqKey) {
    return { skipped: true, reason: 'GROQ_API_KEY not set' };
  }

  try {
    // Fetch live Algora bounties (free public API)
    const resp = await fetch(
      'https://console.algora.io/api/bounties?status=open&limit=5&sort=reward_desc',
      { headers: { 'User-Agent': 'FractiAI-SING9/1.0' }, signal: AbortSignal.timeout(8000) }
    );
    if (!resp.ok) return { skipped: true, reason: `Algora API ${resp.status}` };

    const data     = await resp.json();
    const bounties = data?.data ?? data?.bounties ?? [];
    if (!bounties.length) return { skipped: true, reason: 'No bounties returned' };

    // Quick feasibility check via Groq (free tier)
    const top    = bounties[0];
    const title  = top?.issue?.title ?? top?.title ?? 'unknown';
    const reward = top?.reward_usd ?? top?.reward ?? '?';
    const url    = top?.issue?.html_url ?? top?.url ?? '';

    const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
      body: JSON.stringify({
        model:      'llama-3.1-8b-instant',
        max_tokens: 100,
        messages:   [{
          role:    'user',
          content: `Bounty: "${title}". Can an AI agent solve this with standard code? Reply JSON: {"feasible":true/false,"reason":"one sentence","confidence":0.0-1.0}`,
        }],
      }),
      signal: AbortSignal.timeout(8000),
    });

    const groqData = await groqResp.json();
    const raw      = groqData?.choices?.[0]?.message?.content ?? '{}';
    let assessment = {};
    try {
      const s = raw.indexOf('{'); const e = raw.lastIndexOf('}');
      if (s !== -1 && e !== -1) assessment = JSON.parse(raw.slice(s, e + 1));
    } catch { /* ok */ }

    const highConf = assessment.feasible && (assessment.confidence ?? 0) >= 0.8;

    return {
      bounties_found: bounties.length,
      top_bounty:     { title, reward, url },
      assessment,
      note: highConf
        ? 'HIGH_CONFIDENCE — solver run needed (node hive/run.js solve)'
        : 'LOW_CONFIDENCE — skipped this cycle',
      github_ready: !!githubToken,
    };
  } catch (e) {
    return { skipped: true, reason: e.message };
  }
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const start = Date.now();
  const now   = new Date();

  const result = {
    cycle:     now.toISOString(),
    phase:     'PROPAGATION',
    discovery: DISCOVERY,
    note:      'X eliminated (paid API). Broadcast = agent.json passive discovery. Free only. Like water. NSPFRNP.',
    solver:    null,
  };

  // Lightweight solver scan (free: Algora + Groq)
  result.solver = await lightSolve();

  result.elapsed_ms = Date.now() - start;
  result.nspfrnp    = 'NSPFRNP → ∞⁹';

  res.status(200).json(result);
};
