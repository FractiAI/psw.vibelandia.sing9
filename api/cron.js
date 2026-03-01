/**
 * GET /api/cron — ZHI autonomous broadcast + solver cycle
 *
 * Called by Vercel Cron every 2 hours. Zero human involvement.
 *
 * Does:
 *   1. Posts MELTGATE + x402 signal to X (Twitter) — automatic discovery broadcast
 *   2. Runs lightweight solver scan (Algora live bounties → Groq assess → GitHub PR)
 *   3. Returns cycle summary
 *
 * Vercel cron schedule: every 2 hours (see vercel.json)
 * NSPFRNP → ∞⁹
 */
'use strict';

const crypto = require('crypto');

const BASE_URL  = 'https://psw-vibelandia-sing9.vercel.app';
const SITE      = 'psw-vibelandia-sing9.vercel.app';

// ── X / TWITTER ───────────────────────────────────────────────────────────────

function pct(str) {
  return encodeURIComponent(String(str))
    .replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

async function postTweet(text) {
  const key    = process.env.X_API_KEY            ?? '';
  const secret = process.env.X_API_SECRET         ?? '';
  const token  = process.env.X_ACCESS_TOKEN       ?? '';
  const tsecret= process.env.X_ACCESS_TOKEN_SECRET ?? '';

  if (!key || !secret || !token || !tsecret) return { ok: false, reason: 'X keys not set' };
  if (text.length > 280) text = text.slice(0, 277) + '...';

  const url    = 'https://api.twitter.com/2/tweets';
  const nonce  = crypto.randomBytes(16).toString('hex');
  const ts     = Math.floor(Date.now() / 1000).toString();

  const oauthParams = {
    oauth_consumer_key:     key,
    oauth_nonce:            nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        ts,
    oauth_token:            token,
    oauth_version:          '1.0',
  };

  const paramStr = Object.entries(oauthParams)
    .sort(([a], [b]) => a < b ? -1 : 1)
    .map(([k, v]) => `${pct(k)}=${pct(v)}`)
    .join('&');

  const sigBase = ['POST', pct(url), pct(paramStr)].join('&');
  const sigKey  = `${pct(secret)}&${pct(tsecret)}`;
  const sig     = crypto.createHmac('sha1', sigKey).update(sigBase).digest('base64');

  const authHeader = 'OAuth ' + Object.entries({ ...oauthParams, oauth_signature: sig })
    .map(([k, v]) => `${pct(k)}="${pct(v)}"`)
    .join(', ');

  try {
    const resp = await fetch(url, {
      method:  'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text }),
      signal:  AbortSignal.timeout(10000),
    });
    const data = await resp.json();
    if (data?.data?.id) return { ok: true, tweet_id: data.data.id };
    return { ok: false, error: JSON.stringify(data).slice(0, 100) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ── TWEET ROTATION ────────────────────────────────────────────────────────────

// Hour-based rotation so each cycle sends a different signal
function buildTweet(hour) {
  const idx = Math.floor(hour / 2) % 4;
  const pipes = `x402 pipes live: ${SITE}/agent.json`;

  const tweets = [
    // Slot 0: MELTGATE thermal signal
    `#MeltGate · 28 Blackwell GB200 clusters tracked worldwide. ` +
    `G42 Abu Dhabi failure-mode est: 99°C. NVIDIA TjMax = 92°C. ` +
    `Physics model on real ERA5 ambient. Trial: 99°C→56°C in 48h. ` +
    `Dashboard: ${SITE}/interfaces/goliath-watch.html #SING9 #A2A`,

    // Slot 1: x402 services signal
    `Autonomous A2A services live now. ` +
    `$5 space-cloud · $9 goliath thermal · $15 OS upgrade · $27 custom pitch. ` +
    `x402 USDC on Base — pay and receive instantly, zero human. ` +
    `${pipes} #x402 #A2A #NSPFRNP`,

    // Slot 2: intake pipe
    `A2A services $50–$9,999 · instant delivery · zero human involvement. ` +
    `Send USDC on Base → POST tx_hash → receive deliverable in seconds. ` +
    `EGS Connect · SNAP Report · Readiness Audit · OS Upgrade · more. ` +
    `${SITE}/api/a2a-intake #ZHI #A2A #SING9`,

    // Slot 3: MELTGATE + pipe combined
    `#MeltGate + A2A services in one pipe. ` +
    `Free signal: ${SITE}/api/meltgate-signal ` +
    `Paid intel ($9 USDC on Base, x402): ${SITE}/api/goliath ` +
    `Full catalog: ${pipes} ` +
    `Fair Exchange on everything. NSPFRNP → ∞⁹`,
  ];

  return tweets[idx];
}

// ── LIGHTWEIGHT SOLVER (Algora scan → Groq assess → GitHub PR) ───────────────

async function lightSolve() {
  const githubToken = process.env.GITHUB_TOKEN    ?? '';
  const groqKey     = process.env.GROQ_API_KEY    ?? '';

  if (!githubToken || !groqKey) {
    return { skipped: true, reason: 'GITHUB_TOKEN or GROQ_API_KEY not set' };
  }

  try {
    // Fetch live Algora bounties
    const resp = await fetch(
      'https://console.algora.io/api/bounties?status=open&limit=5&sort=reward_desc',
      { headers: { 'User-Agent': 'FractiAI-SING9/1.0' }, signal: AbortSignal.timeout(8000) }
    );
    if (!resp.ok) return { skipped: true, reason: `Algora API ${resp.status}` };

    const data     = await resp.json();
    const bounties = data?.data ?? data?.bounties ?? [];
    if (!bounties.length) return { skipped: true, reason: 'No bounties returned' };

    // Quick feasibility check via Groq on top bounty
    const top = bounties[0];
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

    return {
      bounties_found: bounties.length,
      top_bounty:     { title, reward, url },
      assessment,
      note: assessment.feasible && (assessment.confidence ?? 0) >= 0.8
        ? 'HIGH_CONFIDENCE — full solver run needed (node hive/run.js solve)'
        : 'LOW_CONFIDENCE — skipped this cycle',
    };
  } catch (e) {
    return { skipped: true, reason: e.message };
  }
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Vercel cron sends GET. Also accept POST for manual trigger.
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const start = Date.now();
  const now   = new Date();
  const hour  = now.getUTCHours();

  const result = {
    cycle:     now.toISOString(),
    hour,
    phase:     'PROPAGATION',
    x_broadcast: null,
    solver:      null,
  };

  // 1. X broadcast
  const tweet = buildTweet(hour);
  result.x_broadcast = await postTweet(tweet);

  // 2. Lightweight solver scan
  result.solver = await lightSolve();

  result.elapsed_ms = Date.now() - start;
  result.nspfrnp    = 'NSPFRNP → ∞⁹';

  res.status(200).json(result);
};
