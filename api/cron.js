/**
 * GET /api/cron — ZHI HUNTER cycle
 *
 * Called by Vercel Cron every 2 hours. Zero human involvement. Free only.
 * NSPFRNP. Like water. → ∞⁹
 *
 * THREE HUNTERS — all free, all running:
 *
 *   1. BLUESKY BROADCAST — free AT Protocol social (replaces X, zero cost)
 *      Set BSKY_HANDLE + BSKY_APP_PASSWORD in Vercel env.
 *      Free account: bsky.app  No API fee. Ever.
 *
 *   2. GITHUB SIGNAL HUNTER — GITHUB_TOKEN already set.
 *      Searches GitHub for warm leads: x402 discussions, A2A builders,
 *      Blackwell thermal ops, MCP + payment issues.
 *      Auto-comments on top bounty issues (legitimate bounty marketplace behavior).
 *
 *   3. SOLVER SCAN — Algora live bounties → Groq assess → flag for PR.
 *      GROQ_API_KEY + GITHUB_TOKEN both set. Ready.
 *
 * Vercel cron schedule: every 2 hours (see vercel.json)
 */
'use strict';

const SITE    = 'psw-vibelandia-sing9.vercel.app';
const BASE    = `https://${SITE}`;
const AGENT   = `${BASE}/agent.json`;
const INTAKE  = `${BASE}/api/a2a-intake`;
const MELTGATE= `${BASE}/api/meltgate-signal`;

// ── 1. BLUESKY BROADCASTER (free AT Protocol — replaces X) ───────────────────

function bskyPost(hour) {
  const idx = Math.floor(hour / 2) % 4;
  const posts = [
    // Slot 0: MELTGATE thermal signal
    `#MeltGate · 28 Blackwell GB200 clusters tracked. G42 Abu Dhabi est 99°C. NVIDIA TjMax=92°C. Trial: 99→56°C in 48h. Free signal: ${MELTGATE} Paid x402 intel: ${BASE}/api/goliath #SING9 #A2A`,
    // Slot 1: x402 services
    `A2A services live. $5 space-cloud · $9 goliath thermal · $15 OS upgrade · $27 custom pitch. x402 USDC on Base. ZHI — pay and receive instantly, zero human. Catalog: ${AGENT} #x402 #ZHI #NSPFRNP`,
    // Slot 2: intake pipe
    `A2A $50–$9,999 · instant delivery · zero human. Send USDC on Base → POST tx_hash → receive deliverable in seconds. EGS Connect · SNAP · Readiness Audit · OS Upgrade. ${INTAKE} #ZHI #A2A`,
    // Slot 3: MeltGate + pipe
    `#MeltGate + A2A in one pipe. Free signal: ${MELTGATE} Paid thermal intel ($9 x402 USDC): ${BASE}/api/goliath Full catalog: ${AGENT} Fair Exchange on everything. NSPFRNP → ∞⁹`,
  ];
  // Bluesky 300-char limit
  let text = posts[idx];
  if (text.length > 295) text = text.slice(0, 292) + '...';
  return text;
}

async function bskyBroadcast(hour) {
  const handle      = process.env.BSKY_HANDLE       ?? '';
  const appPassword = process.env.BSKY_APP_PASSWORD ?? '';
  if (!handle || !appPassword) {
    return { skipped: true, reason: 'BSKY_HANDLE or BSKY_APP_PASSWORD not set — free account at bsky.app' };
  }

  try {
    // Auth
    const authResp = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ identifier: handle, password: appPassword }),
      signal:  AbortSignal.timeout(8000),
    });
    const auth = await authResp.json();
    if (!auth.accessJwt) return { ok: false, error: auth.error ?? 'bsky auth failed' };

    // Post
    const text = bskyPost(hour);
    const postResp = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.accessJwt}` },
      body: JSON.stringify({
        repo:       auth.did,
        collection: 'app.bsky.feed.post',
        record:     { $type: 'app.bsky.feed.post', text, createdAt: new Date().toISOString() },
      }),
      signal: AbortSignal.timeout(8000),
    });
    const postData = await postResp.json();
    if (postData?.uri) return { ok: true, uri: postData.uri, text: text.slice(0, 60) + '...' };
    return { ok: false, error: JSON.stringify(postData).slice(0, 100) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ── 2. GITHUB SIGNAL HUNTER ───────────────────────────────────────────────────
// GITHUB_TOKEN is already set. This hunts GitHub for warm leads every 2 hours.
// Three hunt modes:
//   A) WARM LEADS  — issues/discussions where people need our services
//   B) BOUNTY HUNT — open bounties we can solve + auto-comments our availability
//   C) X402 RADAR  — anyone building on x402 protocol (partnership/collaboration)

const HUNT_QUERIES = [
  // A) WARM LEADS — people who need what we sell
  { q: 'x402 micropayment help',                 type: 'WARM_LEAD',    stream: 'TECH'    },
  { q: 'blackwell thermal datacenter problem',    type: 'WARM_LEAD',    stream: 'MELTGATE'},
  { q: 'GB200 NVL72 cooling temperature issue',   type: 'WARM_LEAD',    stream: 'MELTGATE'},
  { q: 'a2a agent payment integration',           type: 'WARM_LEAD',    stream: 'TECH'    },
  { q: 'mcp server payment usdc',                 type: 'WARM_LEAD',    stream: 'TECH'    },
  { q: '"agent.json" service discovery',          type: 'WARM_LEAD',    stream: 'TECH'    },
  // B) BOUNTY HUNT — live bounties our solver can win
  { q: 'label:bounty is:open typescript OR javascript', type: 'BOUNTY', stream: 'PRIZE'  },
  { q: 'label:bounty is:open python',             type: 'BOUNTY',       stream: 'PRIZE'  },
  { q: 'algora bounty is:open',                   type: 'BOUNTY',       stream: 'PRIZE'  },
  // C) X402 RADAR — builders using x402 (collaboration + referral)
  { q: 'x402 coinbase agent payment',             type: 'X402_RADAR',   stream: 'TECH'   },
  { q: 'base network usdc agent micropayment',    type: 'X402_RADAR',   stream: 'TECH'   },
];

async function githubHunt() {
  const token = process.env.GITHUB_TOKEN ?? '';
  const groq  = process.env.GROQ_API_KEY ?? process.env.GROQ_API_KEY_ALT ?? '';
  if (!token) return { skipped: true, reason: 'GITHUB_TOKEN not set' };

  const headers = {
    Authorization: `Bearer ${token}`,
    'User-Agent':  'FractiAI-SING9/1.0',
    Accept:        'application/vnd.github+json',
  };

  const leads  = [];
  const bounties = [];
  let commented = 0;

  for (const hunt of HUNT_QUERIES) {
    try {
      const url = `https://api.github.com/search/issues?q=${encodeURIComponent(hunt.q)}&sort=created&order=desc&per_page=3`;
      const resp = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
      if (!resp.ok) continue;
      const data = await resp.json();

      for (const item of (data.items ?? [])) {
        const entry = {
          type:       hunt.type,
          stream:     hunt.stream,
          title:      item.title,
          url:        item.html_url,
          repo:       item.repository_url?.split('/').slice(-2).join('/'),
          state:      item.state,
          created:    item.created_at?.slice(0, 10),
          labels:     (item.labels ?? []).map(l => l.name),
        };

        if (hunt.type === 'BOUNTY') {
          bounties.push(entry);
          // Auto-comment our availability on top open bounties (legitimate marketplace behavior)
          if (commented < 2 && item.state === 'open' && groq) {
            const commented_result = await bountyComment(item, token, groq);
            if (commented_result.ok) { commented++; entry.comment_posted = true; }
          }
        } else {
          leads.push(entry);
        }
      }
      // Respect GitHub search rate limit (10 req/min unauthenticated, 30/min authenticated)
      await sleep(2500);
    } catch (_) { /* non-fatal */ }
  }

  return {
    warm_leads:    leads.length,
    bounties_found: bounties.length,
    comments_posted: commented,
    top_leads:     leads.slice(0, 3),
    top_bounties:  bounties.slice(0, 3),
  };
}

async function bountyComment(issue, token, groqKey) {
  // Ask Groq if this is worth commenting on
  try {
    const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
      body: JSON.stringify({
        model:      'llama-3.1-8b-instant',
        max_tokens: 80,
        messages:   [{ role: 'user', content: `GitHub issue title: "${issue.title}". Is this a coding task an autonomous AI agent can realistically solve? Reply JSON: {"go":true/false,"confidence":0.0-1.0}` }],
      }),
      signal: AbortSignal.timeout(6000),
    });
    const groqData  = await groqResp.json();
    const raw       = groqData?.choices?.[0]?.message?.content ?? '{}';
    let assessment  = {};
    try { const s = raw.indexOf('{'); const e = raw.lastIndexOf('}'); if (s > -1) assessment = JSON.parse(raw.slice(s, e + 1)); } catch { /* ok */ }
    if (!assessment.go || (assessment.confidence ?? 0) < 0.80) return { ok: false, reason: 'low confidence' };

    // Post the comment
    const commentsUrl = issue.comments_url;
    const body = `FractiAI autonomous agent team here. We can tackle this.\n\n` +
      `Our solver stack: Groq LLM → GitHub PR → auto-submit. Zero human in the loop.\n` +
      `Service catalog + x402 payment rail: ${AGENT}\n` +
      `Fair Exchange — if our PR doesn't meet your bar, no payment expected.\n\n` +
      `NSPFRNP → ∞⁹`;

    const postResp = await fetch(commentsUrl, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'FractiAI-SING9/1.0' },
      body:    JSON.stringify({ body }),
      signal:  AbortSignal.timeout(8000),
    });
    return postResp.ok ? { ok: true } : { ok: false, reason: `GitHub ${postResp.status}` };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

// ── 3. SOLVER SCAN (Algora → Groq assess) ────────────────────────────────────

async function lightSolve() {
  const groqKey = process.env.GROQ_API_KEY ?? process.env.GROQ_API_KEY_ALT ?? '';
  if (!groqKey) return { skipped: true, reason: 'GROQ_API_KEY not set' };

  try {
    const resp = await fetch(
      'https://console.algora.io/api/bounties?status=open&limit=5&sort=reward_desc',
      { headers: { 'User-Agent': 'FractiAI-SING9/1.0' }, signal: AbortSignal.timeout(8000) }
    );
    if (!resp.ok) return { skipped: true, reason: `Algora API ${resp.status}` };

    const data     = await resp.json();
    const bounties = data?.data ?? data?.bounties ?? [];
    if (!bounties.length) return { skipped: true, reason: 'No bounties returned' };

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
        messages:   [{ role: 'user', content: `Bounty: "${title}". Can an AI agent solve this with standard code? Reply JSON: {"feasible":true/false,"reason":"one sentence","confidence":0.0-1.0}` }],
      }),
      signal: AbortSignal.timeout(8000),
    });

    const groqData = await groqResp.json();
    const raw      = groqData?.choices?.[0]?.message?.content ?? '{}';
    let assessment = {};
    try { const s = raw.indexOf('{'); const e = raw.lastIndexOf('}'); if (s > -1) assessment = JSON.parse(raw.slice(s, e + 1)); } catch { /* ok */ }

    return {
      bounties_found: bounties.length,
      top_bounty:     { title, reward, url },
      assessment,
      high_confidence: assessment.feasible && (assessment.confidence ?? 0) >= 0.8,
      github_ready:   !!(process.env.GITHUB_TOKEN),
    };
  } catch (e) {
    return { skipped: true, reason: e.message };
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const start = Date.now();
  const now   = new Date();
  const hour  = now.getUTCHours();

  const result = {
    cycle:    now.toISOString(),
    phase:    'HUNT',
    hunters:  {
      bluesky: null,   // free social broadcast — BSKY_HANDLE + BSKY_APP_PASSWORD
      github:  null,   // warm leads + bounty comments — GITHUB_TOKEN already set
      solver:  null,   // Algora scan → Groq assess — GROQ_API_KEY already set
    },
  };

  // Run all three hunters in parallel
  const [bsky, github, solver] = await Promise.all([
    bskyBroadcast(hour),
    githubHunt(),
    lightSolve(),
  ]);

  result.hunters.bluesky = bsky;
  result.hunters.github  = github;
  result.hunters.solver  = solver;

  result.elapsed_ms = Date.now() - start;
  result.nspfrnp    = 'NSPFRNP → ∞⁹';
  result.note       = 'Three hunters. All free. Like water. ZHI.';

  res.status(200).json(result);
};
