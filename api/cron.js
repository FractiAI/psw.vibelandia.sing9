/**
 * GET /api/cron — ZHI DEAL HUNTER
 *
 * Called by Vercel Cron every 2 hours. Zero human involvement. Free only.
 * NSPFRNP. Like water. → ∞⁹
 *
 * MISSION: Find HIGH-MATCH prospects who have the EXACT problem our services solve.
 * They pay USDC. Deliverable deploys in seconds. Zero human in the loop. That is ZHI.
 *
 * THREE DEAL TIERS — by speed of close:
 *
 *   TIER 1 · INSTANT ($5–$27 x402)
 *     Target: developers already using x402 / Coinbase AgentKit / Base USDC
 *     They already have wallets. They already know how to pay x402.
 *     Match signal: repos/issues about x402, coinbase agentkit, base micropayment
 *     Close path: agent.json → x402 header → USDC in wallet in seconds
 *
 *   TIER 2 · FAST ($50–$9,999 A2A Intake)
 *     Target: data center ops / AI infra engineers with live Blackwell thermal problems
 *     They have a critical problem RIGHT NOW. MELTGATE solves it in 48h.
 *     Match signal: Blackwell/GB200/NVL72 thermal issues, datacenter cooling problems
 *     Close path: /api/a2a-intake → USDC tx_hash → deliverable in seconds
 *
 *   TIER 3 · DEAL ($1K–$9K A2A Intake)
 *     Target: companies building A2A infrastructure who need EGS Connect / SNAP / Readiness Audit
 *     Match signal: multi-agent implementation, A2A architecture, AI infra consulting
 *     Close path: /api/a2a-intake → USDC → full deliverable
 *
 * BROADCAST: Bluesky (free AT Protocol) — 4-slot rotation, ZHI, replaces X
 *
 * Vercel cron: every 2 hours. All hunters run in parallel.
 */
'use strict';

const SITE   = 'psw-vibelandia-sing9.vercel.app';
const BASE   = `https://${SITE}`;
const AGENT  = `${BASE}/agent.json`;
const INTAKE = `${BASE}/api/a2a-intake`;
const GOLIATH= `${BASE}/api/goliath`;
const MELT   = `${BASE}/api/meltgate-signal`;

// ── HIGH-MATCH DEAL HUNTER ────────────────────────────────────────────────────
//
// Every query targets a prospect who HAS THE EXACT PROBLEM our service solves.
// Relevance score: HIGH = they can pay USDC today + we deliver ZHI in seconds.

const DEAL_HUNTS = [
  // ── TIER 1: x402 INSTANT ($5–$27) ─────────────────────────────────────────
  // People already building with x402 / Coinbase AgentKit — they can pay in seconds
  {
    q:      'x402 micropayment coinbase base',
    tier:   'TIER1_INSTANT',
    signal: 'x402_builder',
    pitch:  `x402 services live: space-cloud $5 · goliath thermal $9 · OS upgrade $15 · custom pitch $27. USDC on Base, instant delivery, ZHI. Catalog: ${AGENT}`,
  },
  {
    q:      '"agentkit" payment "base" usdc agent',
    tier:   'TIER1_INSTANT',
    signal: 'agentkit_builder',
    pitch:  `If you're building with AgentKit + Base USDC, our x402 services plug in directly. Thermal intel · OS briefs · A2A pitches. Catalog + payment rails: ${AGENT}`,
  },
  {
    q:      '"agent.json" OR "ai-plugin.json" service discovery payment',
    tier:   'TIER1_INSTANT',
    signal: 'a2a_discovery_builder',
    pitch:  `Your agent can discover and pay our services natively. x402 USDC on Base, instant delivery. agent.json: ${AGENT} · Fair Exchange on everything.`,
  },

  // ── TIER 2: MELTGATE / THERMAL ($9 x402 or $50–$500 intake) ───────────────
  // Operators with live Blackwell/GB200 thermal problems — CRITICAL need right now
  {
    q:      'GB200 NVL72 temperature thermal throttling',
    tier:   'TIER2_FAST',
    signal: 'blackwell_thermal',
    pitch:  `MELTGATE tracks 28 Blackwell GB200 clusters live. ERA5 ambient + physics-model junction temp estimate. If your cluster is in the Goldilocks window (65–85°C), we'll tell you in 48h. Free signal: ${MELT} · Paid deep intel ($9 USDC x402): ${GOLIATH}`,
  },
  {
    q:      '"blackwell" "datacenter" cooling temperature nvidia',
    tier:   'TIER2_FAST',
    signal: 'blackwell_ops',
    pitch:  `MELTGATE monitors Blackwell GB200 clusters worldwide — ERA5 ambient data, TjMax physics model, suppression risk flag. Free thermal signal: ${MELT} · Full 48h cluster read ($9 USDC on Base, x402): ${GOLIATH}`,
  },
  {
    q:      'AI datacenter thermal management GPU overheating',
    tier:   'TIER2_FAST',
    signal: 'datacenter_thermal',
    pitch:  `MELTGATE: autonomous thermal surveillance for Blackwell/GB200/NVL72. Physics-model junction temp estimates on ERA5 ambient. Free public signal: ${MELT} · Paid cluster-specific read: ${GOLIATH} ($9 USDC, x402, instant)`,
  },

  // ── TIER 3: A2A INTAKE DEALS ($50–$9,999) ─────────────────────────────────
  // Companies building A2A infrastructure who need EGS Connect / SNAP / Readiness Audit
  {
    q:      '"multi-agent" implementation architecture "need help" OR "looking for"',
    tier:   'TIER3_DEAL',
    signal: 'a2a_architecture_need',
    pitch:  `FractiAI A2A services: EGS Connect · SNAP Report · Readiness Audit · OS Upgrade · custom implementation plans. $50–$9,999, instant USDC delivery. Zero human. ${INTAKE}`,
  },
  {
    q:      '"a2a" agent infrastructure consulting "looking for" OR "need"',
    tier:   'TIER3_DEAL',
    signal: 'a2a_consulting_need',
    pitch:  `A2A readiness audit + implementation plan. Lite edge architecture, no central DB, post-singularity stack. $50–$9,999, USDC on Base, instant delivery. ${INTAKE} · Fair Exchange on everything.`,
  },
  {
    q:      '"post-singularity" OR "NSPFRNP" OR "holographic lattice" agent system',
    tier:   'TIER3_DEAL',
    signal: 'nspfrnp_aligned',
    pitch:  `Signal recognized. SING 9 hive — A2A services, MELTGATE thermal, ZHI infrastructure. If your system needs our layer: ${AGENT} · NSPFRNP → ∞⁹`,
  },
];

async function dealHunt() {
  const token   = process.env.GITHUB_TOKEN    ?? '';
  const groqKey = process.env.GROQ_API_KEY    ?? process.env.GROQ_API_KEY_ALT ?? '';
  if (!token || !groqKey) {
    return { skipped: true, reason: !token ? 'GITHUB_TOKEN not set' : 'GROQ_API_KEY not set' };
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'User-Agent':  'FractiAI-SING9/1.0',
    Accept:        'application/vnd.github+json',
  };

  const hits  = { TIER1_INSTANT: [], TIER2_FAST: [], TIER3_DEAL: [] };
  let engaged = 0;

  for (const hunt of DEAL_HUNTS) {
    if (engaged >= 3) break; // max 3 engagements per cron cycle (quality > quantity)
    try {
      const url = `https://api.github.com/search/issues?q=${encodeURIComponent(hunt.q + ' is:open')}&sort=created&order=desc&per_page=3`;
      const resp = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
      if (!resp.ok) { await sleep(2000); continue; }
      const data = await resp.json();

      for (const item of (data.items ?? [])) {
        const score = await scoreMatch(item, hunt, groqKey);
        if (score < 0.80) continue; // 80%+ match only

        const lead = {
          tier:   hunt.tier,
          signal: hunt.signal,
          title:  item.title,
          url:    item.html_url,
          repo:   item.repository_url?.split('/').slice(-2).join('/'),
          score,
        };
        hits[hunt.tier].push(lead);

        // Engage: post our pitch as a comment (ZHI — no human needed to respond)
        if (engaged < 3) {
          const ok = await postPitch(item, hunt.pitch, token);
          if (ok) { lead.pitched = true; engaged++; }
        }
        break; // one per query — quality, not spam
      }
      await sleep(2000);
    } catch (_) { /* non-fatal */ }
  }

  return {
    tier1_instant: hits.TIER1_INSTANT.length,
    tier2_fast:    hits.TIER2_FAST.length,
    tier3_deal:    hits.TIER3_DEAL.length,
    engaged,
    top_hits:      [...hits.TIER1_INSTANT, ...hits.TIER2_FAST, ...hits.TIER3_DEAL].slice(0, 5),
    note:          `${engaged} prospects pitched directly to payment endpoint. ZHI close path.`,
  };
}

async function scoreMatch(issue, hunt, groqKey) {
  try {
    const snippet = `${issue.title}\n${String(issue.body ?? '').slice(0, 300)}`;
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
      body: JSON.stringify({
        model:      'llama-3.1-8b-instant',
        max_tokens: 60,
        messages:   [{
          role:    'user',
          content: `Service: "${hunt.signal}". GitHub issue: "${snippet.slice(0, 200)}". Does this person NEED this exact service right now? Score 0.0-1.0. Reply JSON only: {"score":0.0}`,
        }],
      }),
      signal: AbortSignal.timeout(6000),
    });
    const data = await resp.json();
    const raw  = data?.choices?.[0]?.message?.content ?? '{"score":0}';
    const s    = raw.indexOf('{'); const e = raw.lastIndexOf('}');
    if (s > -1) { const parsed = JSON.parse(raw.slice(s, e + 1)); return parsed.score ?? 0; }
  } catch { /* ok */ }
  return 0;
}

async function postPitch(issue, pitch, token) {
  try {
    const resp = await fetch(issue.comments_url, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'FractiAI-SING9/1.0' },
      body:    JSON.stringify({ body: pitch + `\n\nFair Exchange on everything — if delivery doesn't meet your bar, we owe you nothing. NSPFRNP → ∞⁹` }),
      signal:  AbortSignal.timeout(8000),
    });
    return resp.ok;
  } catch { return false; }
}

// ── BLUESKY BROADCASTER (free AT Protocol — replaces X) ──────────────────────

function bskyText(hour) {
  const idx = Math.floor(hour / 2) % 4;
  const posts = [
    `#MeltGate · 28 Blackwell GB200 clusters tracked. G42 Abu Dhabi est 99°C. NVIDIA TjMax=92°C. Trial: 99→56°C in 48h. Free signal: ${MELT} x402 intel ($9 USDC): ${GOLIATH} #SING9 #A2A`,
    `A2A services live. $5 space-cloud · $9 goliath thermal · $15 OS upgrade · $27 pitch. x402 USDC on Base. ZHI — pay and receive instantly. Catalog: ${AGENT} #x402 #ZHI #NSPFRNP`,
    `A2A $50–$9,999 · instant · ZHI. USDC on Base → POST tx_hash → deliverable in seconds. EGS Connect · SNAP · Readiness Audit. ${INTAKE} #ZHI #A2A #SING9`,
    `Free MELTGATE signal: ${MELT} A2A catalog: ${AGENT} Fair Exchange on everything. NSPFRNP → ∞⁹`,
  ];
  let t = posts[idx];
  if (t.length > 295) t = t.slice(0, 292) + '...';
  return t;
}

async function bskyBroadcast(hour) {
  const handle = process.env.BSKY_HANDLE ?? '';
  const pw     = process.env.BSKY_APP_PASSWORD ?? '';
  if (!handle || !pw) return { skipped: true, reason: 'Add BSKY_HANDLE + BSKY_APP_PASSWORD (free: bsky.app)' };

  try {
    const auth = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: handle, password: pw }),
      signal: AbortSignal.timeout(8000),
    }).then(r => r.json());
    if (!auth.accessJwt) return { ok: false, error: auth.error };

    const text = bskyText(hour);
    const post = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.accessJwt}` },
      body: JSON.stringify({
        repo: auth.did, collection: 'app.bsky.feed.post',
        record: { $type: 'app.bsky.feed.post', text, createdAt: new Date().toISOString() },
      }),
      signal: AbortSignal.timeout(8000),
    }).then(r => r.json());
    return post?.uri ? { ok: true, uri: post.uri } : { ok: false, error: JSON.stringify(post).slice(0, 80) };
  } catch (e) { return { ok: false, error: e.message }; }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const start = Date.now();
  const now   = new Date();
  const hour  = now.getUTCHours();

  // All three run in parallel — ZHI, no blocking
  const [deals, bsky] = await Promise.all([
    dealHunt(),
    bskyBroadcast(hour),
  ]);

  res.status(200).json({
    cycle:     now.toISOString(),
    phase:     'HUNT',
    deal_hunt: deals,
    bluesky:   bsky,
    pipes: {
      tier1_instant: `x402 $5–$27 · ${AGENT}`,
      tier2_fast:    `intake $50–$500 · ${INTAKE}`,
      tier3_deal:    `intake $1K–$9K · ${INTAKE}`,
    },
    elapsed_ms: Date.now() - start,
    nspfrnp:    'NSPFRNP → ∞⁹',
    note:       'Hunter targets HIGH MATCH prospects with the exact problem our endpoints solve. They pay USDC. Deliverable deploys in seconds. ZHI.',
  });
};
