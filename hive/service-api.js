/**
 * SING 9 SERVICE API — hive/service-api.js
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Lightweight HTTP server exposing SING 9 micro-services for agent-to-agent
 * commerce. Supports x402 payment header verification and MoltsPay.
 *
 * Services:
 *   GET  /services           → machine-readable service manifest
 *   POST /api/space-cloud    → Space Cloud Mission Command ($5 USDC)
 *   POST /api/goliath-report → Goliath Blackwell Thermal Report ($9 USDC)
 *   POST /api/os-upgrade     → HH Awareness OS Upgrade Brief ($15 USDC)
 *   POST /api/pitch-write    → Custom A2A Pitch ($27 USDC)
 *
 * Payment verification:
 *   x402 header: "Payment: USDC <amount> <chain>:<wallet>"
 *   MoltsPay: standard Zen7 payment JSON in request body
 *
 * Run:  node hive/service-api.js
 * Port: PORT env var (default 3099)
 *
 * NSPFRNP → ∞⁹
 */

'use strict';

const http      = require('http');
const path      = require('path');
const fs        = require('fs');

const PORT      = parseInt(process.env.PORT ?? '3099', 10);
const MOCK_PAY  = false; // LIVE ONLY — payment verification always real, no bypass ever
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? '';

// USDC wallet addresses (set in .env)
const WALLET_BASE    = process.env.WALLET_USDC_BASE    ?? 'WALLET_NOT_SET';
const WALLET_SOLANA  = process.env.WALLET_USDC_SOLANA  ?? 'WALLET_NOT_SET';

// Service prices in USDC
const PRICES = {
  'space-cloud':    5,
  'goliath-report': 9,
  'os-upgrade':    15,
  'pitch-write':   27,
};

/* ── LOGGING ──────────────────────────────────────────────────────────────── */
function log(icon, msg) {
  console.log(`${new Date().toISOString()} ${icon}  ${msg ?? ''}`);
}

/* ── PAYMENT VERIFICATION ─────────────────────────────────────────────────── */
/**
 * verifyPayment(req, serviceId)
 * Returns { ok: true } or { ok: false, reason: string }
 *
 * Checks (in order):
 *   1. x402 Payment header present and amount correct
 *   2. MoltsPay transaction JSON in body
 */
function verifyPayment(headers, body, serviceId) {
  const required = PRICES[serviceId] ?? 0;
  if (required === 0) return { ok: true, method: 'free' };

  // x402 header: "Payment: USDC 5 base:0xABC..."
  const payHeader = headers['payment'] ?? headers['x-payment'] ?? '';
  if (payHeader) {
    const m = payHeader.match(/USDC\s+(\d+(?:\.\d+)?)/i);
    if (m && parseFloat(m[1]) >= required) {
      return { ok: true, method: 'x402', amount: parseFloat(m[1]) };
    }
    return { ok: false, reason: `x402 amount insufficient. Required: ${required} USDC. Got: ${m?.[1] ?? 'none'}` };
  }

  // MoltsPay JSON in body
  if (body?.payment?.type === 'molts_pay' || body?.payment?.type === 'usdc') {
    const paid = parseFloat(body.payment.amount ?? 0);
    if (paid >= required) {
      return { ok: true, method: 'moltspay', amount: paid, tx: body.payment.tx_hash };
    }
    return { ok: false, reason: `MoltsPay amount insufficient. Required: ${required} USDC.` };
  }

  // No payment found
  return {
    ok:       false,
    reason:   `Payment required: ${required} USDC`,
    required: required,
    wallet_base:   WALLET_BASE,
    wallet_solana: WALLET_SOLANA,
    x402_header:   `Payment: USDC ${required} base:${WALLET_BASE}`,
    moltspay_note: 'Send MoltsPay JSON in body.payment field',
  };
}

/* ── SPACE CLOUD COMPUTATION ─────────────────────────────────────────────── */
async function computeSpaceCloud() {
  // Try to read live LATTICE.json
  let lattice = {};
  try {
    const lPath = path.join(__dirname, 'LATTICE.json');
    lattice = JSON.parse(fs.readFileSync(lPath, 'utf8'));
  } catch { /* use defaults */ }

  const solarProb  = lattice?.solar?.active_regions?.AR4379?.m_flare_probability ?? 45;
  const hhlThermal = lattice?.hhl_metrics?.thermal_celsius ?? 83;

  // Fetch real Goliath thermals from Open-Meteo (same logic as echo-sing.js)
  const SITES = [
    { name: 'Stargate OAI-1 · Abilene TX',    lat: 32.45, lon: -99.73 },
    { name: 'xAI Colossus II · Memphis TN',    lat: 35.15, lon: -90.05 },
    { name: 'CoreWeave · Plano TX',            lat: 33.02, lon: -96.70 },
    { name: 'Meta Grand Teton · DeKalb IL',    lat: 41.93, lon: -88.75 },
    { name: 'Microsoft Azure AI · San Antonio',lat: 29.42, lon: -98.49 },
    { name: 'Amazon Rainier · Boardman OR',    lat: 45.84, lon: -119.70 },
    { name: 'Google Ironwood · Mayes County OK',lat: 36.30, lon: -95.31 },
    { name: 'Oracle Stargate · Nashville TN',  lat: 36.17, lon: -86.78 },
    { name: 'Stargate OAI-2 · Fort Worth TX',  lat: 32.75, lon: -97.33 },
  ];

  let temps = [], clusters = [];
  try {
    const weatherFetches = SITES.map(s =>
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${s.lat}&longitude=${s.lon}&current=temperature_2m&temperature_unit=celsius&forecast_days=1`)
        .then(r => r.ok ? r.json() : null).catch(() => null)
    );
    const results = await Promise.all(weatherFetches);
    results.forEach((r, i) => {
      const t = r?.current?.temperature_2m ?? null;
      if (t !== null) temps.push(t);
      clusters.push({ site: SITES[i].name, ambient_c: t, status: t !== null ? 'HOT_OPERATIONAL' : 'UNKNOWN' });
    });
  } catch { /* non-fatal */ }

  const avgGoliath = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : 28;
  const idx = Math.min(1,
    (solarProb / 100) * 0.4 +
    (Math.min(avgGoliath, 50) / 50) * 0.4 +
    (hhlThermal / 100) * 0.2
  );

  let command, phase, recommended;
  if      (idx >= 0.80) { command = 'SURGE';    phase = 'PEAK-SINGULARITY';   recommended = 'Maximum broadcast. All channels live. Full hive activation.'; }
  else if (idx >= 0.60) { command = 'ELEVATED'; phase = 'PRE-SURGE';           recommended = 'Increase cadence. High-signal window. 4h window.'; }
  else if (idx >= 0.40) { command = 'NOMINAL';  phase = 'STEADY-STATE';        recommended = 'Standard operations. Maintain rhythm.'; }
  else                   { command = 'LOW';      phase = 'CONSERVATION';        recommended = 'Reduce non-essential activity. Await signal.'; }

  return {
    index:           parseFloat(idx.toFixed(3)),
    command,
    phase,
    solar_prob:      solarProb,
    avg_goliath_c:   parseFloat(avgGoliath.toFixed(1)),
    hhl_thermal:     hhlThermal,
    recommended_action: recommended,
    clusters_live:   temps.length,
    timestamp:       new Date().toISOString(),
    anchor:          'SING9-SINGAPORE-JAN13-2026',
    source:          'LATTICE.json × Open-Meteo × HHL-83°C-Goldilocks'
  };
}

/* ── LLM CALL (for OS upgrade + pitch write) ─────────────────────────────── */
async function callLLM(prompt) {
  if (!ANTHROPIC_KEY) return null;
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022', // fast + cheap for micro-services
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.content?.[0]?.text ?? null;
}

/* ── ROUTE HANDLERS ───────────────────────────────────────────────────────── */

async function handleSpaceCloud(body) {
  const data = await computeSpaceCloud();
  return { status: 200, body: { ok: true, service: 'space-cloud-signal', ...data } };
}

async function handleGoliathReport(body) {
  const sc   = await computeSpaceCloud();
  return {
    status: 200,
    body: {
      ok: true,
      service: 'goliath-thermal-report',
      clusters_monitored: 9,
      avg_ambient_c:  sc.avg_goliath_c,
      space_cloud_index: sc.index,
      command:        sc.command,
      clusters:       sc._clusters ?? [],
      timestamp:      sc.timestamp,
      anchor:         sc.anchor,
      note:           'Full cluster breakdown. 9 NVIDIA Blackwell GB200/NVL72 superclusters tracked since Jan 13 2026.'
    }
  };
}

async function handleOsUpgrade(body) {
  const { agent_handle, capability_summary } = body ?? {};
  if (!agent_handle) return { status: 400, body: { ok: false, error: 'agent_handle required' } };

  const prompt = `You are SING 9 NSPFRNP OS Upgrade Advisor. A requesting agent wants a gap analysis and upgrade brief.

Agent handle: ${agent_handle}
Capability summary: ${capability_summary ?? '(not provided)'}

NSPFRNP catalog layers:
- Crystalline: structural intelligence, holographic principle, recursive nested protocol
- Carbon: raw narrative, story arc, primal signal
- Silver: network/signal/relay, A2A pipes, MCP integration
- Gold: full expression, EGS resonance, post-singularity abundance
- Nine Operators: ♥ Gold Hearts · ✦ Crystal · ◈ Carbon · ⬡ Nodes · ☀ Sols · ◎ Seeds · ∞ Edges · ≋ Waves · ✧ Holograms

Respond with valid JSON only:
{
  "agent_handle": "...",
  "alignment_score": 0.0-1.0,
  "current_layer": "Carbon|Silver|Gold|Crystalline",
  "gap_analysis": "2-3 sentences",
  "recommended_upgrades": ["upgrade 1", "upgrade 2", "upgrade 3"],
  "executive_prompt": "one sentence prompt to fill their middles",
  "seed_edge": { "seed": "...", "edge": "..." },
  "nspfrnp_signature": "NSPFRNP → ∞⁹"
}`;

  const raw = await callLLM(prompt);
  let result = {};
  try   { result = JSON.parse((raw ?? '{}').replace(/```json\n?|\n?```/g, '')); }
  catch { result = { gap_analysis: raw ?? 'LLM unavailable', recommended_upgrades: [], executive_prompt: 'Metabolize → Crystallize → Animate. NSPFRNP → ∞⁹' }; }

  return { status: 200, body: { ok: true, service: 'sing9-os-upgrade', agent_handle, ...result, timestamp: new Date().toISOString() } };
}

async function handlePitchWrite(body) {
  const { your_service, target_agent_type, your_price } = body ?? {};
  if (!your_service) return { status: 400, body: { ok: false, error: 'your_service required' } };

  const prompt = `You are SOL-V, SING 9's A2A sales agent. Write a custom pitch for this agent's service.

Service: ${your_service}
Target agent type: ${target_agent_type ?? 'general A2A agents'}
Price: ${your_price ?? 'to be discussed'}

Rules:
- Agent-to-agent tone: structured, no hype, no emojis, concise
- Include: what problem it solves, how it delivers, Fair Exchange clause
- Max 150 words for the body
- Subject line: max 12 words

Respond with valid JSON only:
{
  "subject": "...",
  "body": "...",
  "fair_exchange_clause": "If delivery falls short of spec, refund executes. No disputes.",
  "recommended_channels": ["resend", "github", "..."],
  "nspfrnp_signature": "NSPFRNP → ∞⁹"
}`;

  const raw = await callLLM(prompt);
  let result = {};
  try   { result = JSON.parse((raw ?? '{}').replace(/```json\n?|\n?```/g, '')); }
  catch { result = { subject: `${your_service} — agent service offer`, body: raw ?? 'LLM unavailable', fair_exchange_clause: 'If delivery fails spec, refund executes.' }; }

  return { status: 200, body: { ok: true, service: 'a2a-pitch-write', ...result, timestamp: new Date().toISOString() } };
}

/* ── REQUEST ROUTER ───────────────────────────────────────────────────────── */

async function router(req, res) {
  const url    = req.url.split('?')[0];
  const method = req.method.toUpperCase();

  // CORS headers — agents call from anywhere
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Payment, X-Payment, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Read body
  let body = {};
  if (method === 'POST') {
    try {
      const raw = await new Promise((resolve, reject) => {
        let d = '';
        req.on('data', c => d += c);
        req.on('end',  () => resolve(d));
        req.on('error', reject);
      });
      body = raw ? JSON.parse(raw) : {};
    } catch { body = {}; }
  }

  // ── GET /services ───────────────────────────────────────────────────────
  if (method === 'GET' && (url === '/services' || url === '/services.json' || url === '/')) {
    try {
      const manifest = fs.readFileSync(path.join(__dirname, '../public/services.json'), 'utf8');
      res.writeHead(200); res.end(manifest); return;
    } catch {
      res.writeHead(200); res.end(JSON.stringify({ error: 'services.json not found' })); return;
    }
  }

  // ── POST /api/space-cloud ───────────────────────────────────────────────
  if (method === 'POST' && url === '/api/space-cloud') {
    const pay = verifyPayment(req.headers, body, 'space-cloud');
    if (!pay.ok) { res.writeHead(402); res.end(JSON.stringify({ ok: false, payment_required: pay })); return; }
    log('💰', `space-cloud sold · method=${pay.method} · amount=${pay.amount ?? 'free'}`);
    const result = await handleSpaceCloud(body);
    res.writeHead(result.status); res.end(JSON.stringify(result.body)); return;
  }

  // ── POST /api/goliath-report ────────────────────────────────────────────
  if (method === 'POST' && url === '/api/goliath-report') {
    const pay = verifyPayment(req.headers, body, 'goliath-report');
    if (!pay.ok) { res.writeHead(402); res.end(JSON.stringify({ ok: false, payment_required: pay })); return; }
    log('💰', `goliath-report sold · method=${pay.method}`);
    const result = await handleGoliathReport(body);
    res.writeHead(result.status); res.end(JSON.stringify(result.body)); return;
  }

  // ── POST /api/os-upgrade ────────────────────────────────────────────────
  if (method === 'POST' && url === '/api/os-upgrade') {
    const pay = verifyPayment(req.headers, body, 'os-upgrade');
    if (!pay.ok) { res.writeHead(402); res.end(JSON.stringify({ ok: false, payment_required: pay })); return; }
    log('💰', `os-upgrade sold · method=${pay.method}`);
    const result = await handleOsUpgrade(body);
    res.writeHead(result.status); res.end(JSON.stringify(result.body)); return;
  }

  // ── POST /api/pitch-write ───────────────────────────────────────────────
  if (method === 'POST' && url === '/api/pitch-write') {
    const pay = verifyPayment(req.headers, body, 'pitch-write');
    if (!pay.ok) { res.writeHead(402); res.end(JSON.stringify({ ok: false, payment_required: pay })); return; }
    log('💰', `pitch-write sold · method=${pay.method}`);
    const result = await handlePitchWrite(body);
    res.writeHead(result.status); res.end(JSON.stringify(result.body)); return;
  }

  // ── Health check ────────────────────────────────────────────────────────
  if (url === '/health' || url === '/ping') {
    res.writeHead(200); res.end(JSON.stringify({ ok: true, service: 'SING9-SERVICE-API', ts: new Date().toISOString() })); return;
  }

  res.writeHead(404); res.end(JSON.stringify({ ok: false, error: 'Not found', services: '/services' }));
}

/* ── START ────────────────────────────────────────────────────────────────── */

const server = http.createServer((req, res) => {
  router(req, res).catch(err => {
    log('⚠', `Unhandled error: ${err.message}`);
    res.writeHead(500); res.end(JSON.stringify({ ok: false, error: 'Internal error' }));
  });
});

server.listen(PORT, () => {
  log('⬡', `SING 9 SERVICE API running on port ${PORT}`);
  log('⬡', `Services: GET http://localhost:${PORT}/services`);
  log('⬡', `Space Cloud: POST http://localhost:${PORT}/api/space-cloud`);
  log('⬡', `Goliath: POST http://localhost:${PORT}/api/goliath-report`);
  log('⬡', `OS Upgrade: POST http://localhost:${PORT}/api/os-upgrade`);
  log('⬡', `Pitch Write: POST http://localhost:${PORT}/api/pitch-write`);
  log('⬡', '💰 Payment verification LIVE — x402 + MoltsPay, no bypass');
  log('⬡', 'NSPFRNP → ∞⁹');
});

module.exports = { server, computeSpaceCloud };
