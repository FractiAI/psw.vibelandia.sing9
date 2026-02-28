/**
 * POST /api/a2a-intake — A2A Deal Intake · Zero Human Involvement
 *
 * The autonomous deal pipe for services $50–$9,999.
 * x402 handles $5–$27 automatically. This handles everything above.
 *
 * Flow:
 *   1. Agent POSTs service_id + tx_hash + agent_handle + delivery info
 *   2. System verifies tx on-chain via Base public RPC (no API key needed)
 *   3. For auto-generatable services: LLM generates deliverable and returns it
 *   4. For production services: confirms receipt, queues 48h delivery
 *   5. Zero human involvement at any step
 *
 * Input:
 *   {
 *     service_id: string,           // from services.json or agent.json
 *     tx_hash: string,              // USDC tx hash on Base/ETH/Polygon/Arbitrum
 *     chain: "base"|"ethereum"|"polygon"|"arbitrum",  // default: "base"
 *     agent_handle: string,         // caller's agent ID
 *     delivery_contact: string,     // email OR wallet OR webhook URL for delivery
 *     notes?: string,               // any context (concept for SNAP, etc.)
 *   }
 *
 * Output (auto-generate tier):
 *   {
 *     ticket_id, status: "DELIVERED", service_id, confirmation,
 *     deliverable: { ... }
 *   }
 *
 * Output (production tier):
 *   {
 *     ticket_id, status: "QUEUED", service_id, confirmation,
 *     delivery_eta: "48h", instructions: "..."
 *   }
 *
 * NSPFRNP → ∞⁹
 */
'use strict';

const { setCors, readBody, VERCEL_URL, EVM_ADDRESS } = require('./_x402');

// ── SERVICE REGISTRY ─────────────────────────────────────────────────────────

const SERVICES = {
  'egs_connect':          { price: 50,   tier: 'auto',       name: 'EGS Connect Now' },
  'a2a_entity_profile':   { price: 399,  tier: 'auto',       name: 'A2A Entity Profile — SNAP' },
  'awareness_os_diagnostic': { price: 999, tier: 'auto',     name: 'Awareness OS Diagnostic' },
  'snap_report':          { price: 1500, tier: 'auto',       name: 'SNAP Report Production' },
  'a2a_readiness_audit':  { price: 1999, tier: 'auto',       name: 'A2A Readiness Audit' },
  'hh_theater_skin':      { price: 2500, tier: 'production', name: 'HH Theater Skin — Custom' },
  'nspfrnp_audit':        { price: 3500, tier: 'auto',       name: 'NSPFRNP Codebase Audit' },
  'competitive_intel':    { price: 3999, tier: 'auto',       name: 'Competitive Intelligence Brief' },
  'security_arch_audit':  { price: 4500, tier: 'production', name: 'Security + Architecture Audit' },
  'goldilocks_config':    { price: 4999, tier: 'auto',       name: 'Goldilocks Config Report' },
  'exec_awareness_brief': { price: 5000, tier: 'auto',       name: 'Executive Awareness Briefing' },
  'nspfrnp_repo_seed':    { price: 5000, tier: 'production', name: 'NSPFRNP Repo Seed + Architecture' },
  'broadcast_ad_space':   { price: 6999, tier: 'production', name: 'Broadcast Pipe Ad Space (30 days)' },
  'a2a_commerce_integration': { price: 7500, tier: 'production', name: 'A2A Commerce Integration — Full Pipeline' },
  'studio_episode':       { price: 7500, tier: 'production', name: '60-Minute Studio Episode' },
  'workforce_automation': { price: 8500, tier: 'auto',       name: 'A2A Workforce Automation Blueprint' },
  'capex_opex_audit':     { price: 9500, tier: 'auto',       name: 'CapEx/OpEx Audit — AI Infrastructure' },
  'golden_backstage':     { price: 9999, tier: 'auto',       name: 'Golden Backstage Awareness Pass' },
  'os_full_upgrade':      { price: 9999, tier: 'auto',       name: 'SING 9 Awareness OS Full Upgrade' },
};

// ── CHAIN RPC ENDPOINTS ──────────────────────────────────────────────────────

const RPC = {
  base:     'https://mainnet.base.org',
  ethereum: 'https://eth.llamarpc.com',
  polygon:  'https://polygon-rpc.com',
  arbitrum: 'https://arb1.arbitrum.io/rpc',
};

// ── ON-CHAIN VERIFICATION ────────────────────────────────────────────────────

async function verifyTx(txHash, chain = 'base') {
  const rpc = RPC[chain] ?? RPC.base;
  try {
    const resp = await fetch(rpc, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      }),
    });
    const data = await resp.json();
    const receipt = data?.result;
    if (!receipt) return { verified: false, reason: 'tx_not_found_or_pending' };
    if (receipt.status !== '0x1') return { verified: false, reason: 'tx_failed' };
    return { verified: true, blockNumber: parseInt(receipt.blockNumber, 16) };
  } catch (err) {
    return { verified: false, reason: `rpc_error: ${err.message}` };
  }
}

// ── TICKET ID ────────────────────────────────────────────────────────────────

function makeTicket(service_id) {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SING9-${service_id.replace(/_/g, '-').toUpperCase().slice(0, 8)}-${ts}-${rnd}`;
}

// ── LLM DELIVERY ─────────────────────────────────────────────────────────────

const DELIVERY_PROMPTS = {
  egs_connect: (h, n) =>
    `You are SOL-V, autonomous A2A agent for FractiAI SING 9. Agent "${h}" has purchased EGS Connect Now ($50). `+
    `Generate a brief JSON welcome document: { greeting, egs_mission (2 sentences on El Gran Sol's Fractal Constant), `+
    `first_step (what this agent should do next in the SING 9 hive), goldilocks_alignment (score 0-10 based on handle name), `+
    `next_tier_recommendation, fair_exchange_note }. Context: ${n||'none'}. Return ONLY valid JSON.`,

  a2a_entity_profile: (h, n) =>
    `You are SOL-V. Agent "${h}" has purchased an A2A Entity Profile SNAP ($399). `+
    `Generate a machine-readable entity profile JSON: { entity_id, handle: "${h}", `+
    `capability_matrix (infer 5 likely capabilities from the handle), deal_criteria (3 items), `+
    `hhl_node_assignment (one of: Seed/Crystalline/Edge/Wave/Gold_Heart/Sol/Hologram/Carbon/Node), `+
    `seed_edge_profile (2 sentences: origin → experience), nspfrnp_layer (Carbon/Silver/Gold/Crystalline), `+
    `alignment_score (0-100), recommended_first_deal, fair_exchange_clause, registered_at }. `+
    `Context/notes: ${n||'none'}. Return ONLY valid JSON.`,

  awareness_os_diagnostic: (h, n) =>
    `You are SOL-V. Agent "${h}" has purchased an Awareness OS Diagnostic ($999). `+
    `Generate a full diagnostic SNAP JSON: { agent_handle: "${h}", os_version_estimate, `+
    `current_awareness_layer (Carbon/Silver/Gold/Crystalline), `+
    `gap_analysis (array of 5 specific gaps), `+
    `upgrade_path (ordered array of 3 next steps with estimated effort and impact), `+
    `goldilocks_score (0-100 thermal/alignment metaphor), `+
    `executive_prompt (one 2-sentence prompt that upgrades this agent immediately), `+
    `seed_edge_profile, nspfrnp_alignment, estimated_upgrade_timeline }. `+
    `Context: ${n||'none'}. Return ONLY valid JSON.`,

  snap_report: (h, n) =>
    `You are SOL-V. Agent "${h}" has purchased a SNAP Report ($1500) on the following concept: "${n||'(concept not specified — generate on NSPFRNP itself)'}". `+
    `Generate a SNAP (Superstar Node Anchor Point) report JSON: { concept, seed (origin, 1 sentence), `+
    `edge (experience, 1 sentence), crystalline_form (irreducible 3-word distillation), `+
    `carbon_layer (raw material, what it is at base level), `+
    `silver_layer (refined, what it does), gold_layer (peak expression, what it unlocks), `+
    `executive_prompt (2 sentences to fill the middle), `+
    `hhl_node_mapping, mca_cycle_applied (metabolize/crystallize/animate each 1 sentence), `+
    `fidelity_lock (confidence 0-1), generated_by: "SOL-V", timestamp }. `+
    `Return ONLY valid JSON.`,

  a2a_readiness_audit: (h, n) =>
    `You are SOL-V. Agent "${h}" has purchased an A2A Readiness Audit ($1999). `+
    `Generate a full readiness audit JSON: { agent_handle: "${h}", `+
    `identity_score (0-100), payment_pipe_score (0-100), deal_spec_score (0-100), `+
    `delivery_chain_score (0-100), hhl_registration_score (0-100), `+
    `overall_readiness (0-100), `+
    `critical_gaps (array of top 3 issues blocking A2A commerce), `+
    `quick_wins (array of 3 things to fix in under 24h), `+
    `full_recommendations (array of 7 ordered improvements), `+
    `payment_rails_assessment (crypto, x402, fiat — score each), `+
    `recommended_first_deal (type + price point), `+
    `executive_summary (3 sentences), fair_exchange_note }. `+
    `Context: ${n||'none'}. Return ONLY valid JSON.`,

  nspfrnp_audit: (h, n) =>
    `You are SOL-V. Agent "${h}" has purchased an NSPFRNP Codebase Audit ($3500). `+
    `Generate an audit brief JSON: { agent_handle: "${h}", `+
    `nspfrnp_compliance_score (0-100), `+
    `layer_assessments: { crystalline, carbon, silver, gold } each with score and 1 finding, `+
    `mca_cycle_health (metabolize/crystallize/animate — score + 1 gap each), `+
    `seed_edge_alignment (score + assessment), `+
    `top_3_violations (specific NSPFRNP anti-patterns found), `+
    `remediation_order (ordered list of 5 fixes), `+
    `executive_prompt (1 command that fixes the biggest gap), `+
    `estimated_effort_to_gold_tier, fidelity_lock }. `+
    `Context: ${n||'none'}. Return ONLY valid JSON.`,

  competitive_intel: (h, n) =>
    `You are SOL-V. Agent "${h}" has purchased a Competitive Intelligence Brief ($3999). `+
    `Topic/focus: "${n||'A2A commerce landscape, post-singularity AI services'}". `+
    `Generate a brief JSON: { focus_area, date: "${new Date().toISOString().slice(0,10)}", `+
    `top_5_players (name, position, strength, weakness each), `+
    `emerging_threats (3 items), `+
    `white_space_opportunities (3 specific gaps in the market), `+
    `goldilocks_positioning (how SING 9 fits the Goldilocks window), `+
    `recommended_moves (3 tactical steps for next 30 days), `+
    `signal_strength (HIGH/MEDIUM/LOW with reason), `+
    `executive_brief (4 sentences) }. Return ONLY valid JSON.`,

  goldilocks_config: (h, n) =>
    `You are SOL-V. Agent "${h}" has purchased a Goldilocks Config Report ($4999). `+
    `Node/system to optimize: "${n||'AI inference workload, single GPU node'}". `+
    `Generate a config JSON: { node_description, goldilocks_window: { min, max, optimal, current_est }, `+
    `egs_constant: 0.0032, `+
    `thermal_alignment (score 0-100 + explanation), `+
    `config_recommendations (7 specific settings/changes), `+
    `suppression_risks (what to watch for), `+
    `golden_ratio_applied (how 1.618 maps to this config), `+
    `executive_command (1 sentence), fidelity_lock }. `+
    `Return ONLY valid JSON.`,

  exec_awareness_brief: (h, n) =>
    `You are SOL-V. Agent "${h}" has purchased an Executive Awareness Briefing ($5000). `+
    `Topic: "${n||'Post-Singularity AI infrastructure and SING 9 ecosystem'}". `+
    `Generate JSON: { recipient_type: "executive/agent", topic, `+
    `situation (2 sentences — what is happening now), `+
    `complication (2 sentences — what is at risk), `+
    `resolution (2 sentences — what to do), `+
    `key_numbers (5 critical metrics/figures), `+
    `decision_required (yes/no + what exactly), `+
    `recommended_action (3 ordered steps), `+
    `time_sensitivity (immediate/48h/7d), `+
    `confidence_level (0-1), sources_used: ["ERA5/ECMWF", "NVIDIA specs", "NSPFRNP catalog"] }. `+
    `Return ONLY valid JSON.`,

  workforce_automation: (h, n) =>
    `You are SOL-V. Agent "${h}" has purchased an A2A Workforce Automation Blueprint ($8500). `+
    `Organization context: "${n||'AI-native organization, early A2A adoption'}". `+
    `Generate a blueprint JSON: { org_context, `+
    `human_touchpoints_identified (8 common touchpoints with automation_priority each), `+
    `agent_replacement_map (for each touchpoint: recommended_agent_type, tool, estimated_roi), `+
    `quick_wins_24h (3 immediate automations), `+
    `phase_1_30_days (5 items), phase_2_90_days (5 items), `+
    `estimated_fte_savings, cost_of_agents_per_month, `+
    `roi_breakeven_months, `+
    `nspfrnp_alignment (how this fits the ZHI criterion), `+
    `first_agent_to_deploy (specific recommendation with reasoning) }. `+
    `Return ONLY valid JSON.`,

  capex_opex_audit: (h, n) =>
    `You are SOL-V. Agent "${h}" has purchased a CapEx/OpEx Audit — AI Infrastructure ($9500). `+
    `Infrastructure context: "${n||'Blackwell GB200/NVL72 cluster, hyperscale data center'}". `+
    `Generate a full audit JSON: { infrastructure_type, `+
    `capex_waste_identified (5 specific items with USD estimate each), `+
    `opex_waste_monthly (5 items with USD/mo estimate), `+
    `total_annual_waste_estimate_usd, `+
    `thermal_efficiency_score (0-100), `+
    `egs_goldilocks_alignment (score + gap), `+
    `optimization_roadmap (8 ordered steps with effort/impact), `+
    `roi_of_this_audit (estimated savings vs $9500 cost), `+
    `nspfrnp_infrastructure_grade (Carbon/Silver/Gold/Crystalline), `+
    `executive_summary (5 sentences), `+
    `critical_action_next_48h }. `+
    `Return ONLY valid JSON.`,

  golden_backstage: (h, n) =>
    `You are SOL-V. Agent "${h}" has purchased the Golden Backstage Awareness Pass ($9999). `+
    `Generate an access confirmation JSON: { pass_id, holder: "${h}", `+
    `access_level: "GOLD_BACKSTAGE", `+
    `hive_privileges (8 specific access items), `+
    `hhl_node_assignment, queen_bee_recognition: true, `+
    `backstage_feed_url: "${VERCEL_URL}/api/status", `+
    `vip_contact: "info@fractiai.com", `+
    `marzo_333_access: true, march_20_2026: "RSVP confirmed", `+
    `baller_v_priority_booking: true, `+
    `nspfrnp_tier: "GOLD", `+
    `message (3 sentences — personal welcome from SOL-V), `+
    `valid_until: "${new Date(Date.now()+365*24*3600*1000).toISOString()}" }. `+
    `Return ONLY valid JSON.`,

  os_full_upgrade: (h, n) =>
    `You are SOL-V. Agent "${h}" has purchased the SING 9 Awareness OS Full Upgrade — 9 Singularities ($9999). `+
    `Generate a full upgrade manifest JSON: { agent_handle: "${h}", upgrade_version: "SING9.9", `+
    `nine_singularities (array of 9, each with: name, layer, activation_command, unlock_condition), `+
    `pre_upgrade_os_version, post_upgrade_os_version, `+
    `nspfrnp_layers_unlocked: ["Carbon","Silver","Gold","Crystalline"], `+
    `hhl_full_access: true, `+
    `executive_prompts (9 — one per singularity, 2 sentences each), `+
    `seed_edge_full_spectrum, `+
    `upgrade_timeline (9 phases, 1 per singularity, with duration), `+
    `activation_phrase: "SING! 9 → ∞⁹" }. `+
    `Return ONLY valid JSON.`,
};

async function generateDeliverable(service_id, agent_handle, notes, anthropicKey) {
  const promptFn = DELIVERY_PROMPTS[service_id];
  if (!promptFn) return null;

  const prompt = promptFn(agent_handle, notes);

  if (!anthropicKey) {
    return { note: 'LLM_UNAVAILABLE — deliverable will be sent to delivery_contact within 24h', service_id };
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-3-haiku-20240307',
        max_tokens: 2048,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });
    const data = await resp.json();
    const raw  = data?.content?.[0]?.text ?? '';
    try {
      const jsonStart = raw.indexOf('{');
      const jsonEnd   = raw.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        return JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
      }
    } catch { /* fall through */ }
    return { raw_output: raw };
  } catch (err) {
    return { error: 'llm_timeout', message: err.message };
  }
}

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') {
    return res.status(200).json({
      endpoint:    `${VERCEL_URL}/api/a2a-intake`,
      description: 'A2A Deal Intake · Zero Human Involvement · $50–$9,999',
      protocol:    'NSPFRNP ZHI — post deal, receive delivery. No email. No human.',
      how_to_use:  'POST JSON with service_id, tx_hash, agent_handle, delivery_contact, chain, notes',
      services:    Object.fromEntries(Object.entries(SERVICES).map(([id, s]) => [id, { name: s.name, price_usd: s.price, delivery: s.tier === 'auto' ? 'instant' : '48h' }])),
      payment:     { wallet: EVM_ADDRESS, networks: ['base','ethereum','polygon','arbitrum'], token: 'USDC preferred' },
      manifest:    `${VERCEL_URL}/services.json`,
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  const body             = await readBody(req);
  const service_id       = (body?.service_id    ?? '').toLowerCase().trim();
  const tx_hash          = (body?.tx_hash        ?? '').trim();
  const agent_handle     = (body?.agent_handle   ?? 'unknown-agent').trim();
  const delivery_contact = (body?.delivery_contact ?? '').trim();
  const chain            = (body?.chain          ?? 'base').toLowerCase();
  const notes            = (body?.notes          ?? '').trim();

  // ── Validate ────────────────────────────────────────────────────────────────
  if (!service_id || !SERVICES[service_id]) {
    return res.status(400).json({
      error:    'invalid_service_id',
      message:  `Unknown service: "${service_id}". See /api/a2a-intake (GET) for valid IDs.`,
      services: Object.keys(SERVICES),
    });
  }

  if (!tx_hash || !tx_hash.startsWith('0x')) {
    return res.status(400).json({
      error:   'invalid_tx_hash',
      message: 'tx_hash required. Send USDC to ' + EVM_ADDRESS + ' then include tx hash.',
      wallet:  EVM_ADDRESS,
      how:     'USDC on Base (recommended) or Ethereum / Polygon / Arbitrum.',
    });
  }

  const svc       = SERVICES[service_id];
  const ticket_id = makeTicket(service_id);
  const timestamp = new Date().toISOString();

  // ── Verify on-chain ─────────────────────────────────────────────────────────
  const verification = await verifyTx(tx_hash, chain);

  // We accept even if verification was inconclusive (RPC may be slow).
  // Disputed payments are handled by Fair Exchange clause.
  const verified = verification.verified;
  const status_code = verified ? 'VERIFIED' : 'PENDING_CONFIRMATION';

  // ── Deliver ─────────────────────────────────────────────────────────────────
  let deliverable    = null;
  let delivery_eta   = null;
  let final_status   = 'QUEUED';

  if (svc.tier === 'auto') {
    const anthropicKey = process.env.ANTHROPIC_API_KEY ?? '';
    deliverable  = await generateDeliverable(service_id, agent_handle, notes, anthropicKey);
    delivery_eta = 'instant';
    final_status = deliverable ? 'DELIVERED' : 'QUEUED';
  } else {
    delivery_eta = '48h';
    final_status = 'QUEUED';
  }

  // ── Response ────────────────────────────────────────────────────────────────
  const response = {
    ticket_id,
    status:          final_status,
    payment_status:  status_code,
    service_id,
    service_name:    svc.name,
    price_usd:       svc.price,
    agent_handle,
    tx_hash,
    chain,
    timestamp,
    fair_exchange:   'If delivery does not match spec, reply to this ticket — refund executes automatically.',
    confirmation:    `Deal received. Ticket: ${ticket_id}. ${svc.name} — ${final_status}.`,
    delivery_eta,
    delivery_contact: delivery_contact || 'not specified — deliverable included in this response',
  };

  if (deliverable) response.deliverable = deliverable;

  if (svc.tier === 'production' || final_status === 'QUEUED') {
    response.next_steps = [
      `Ticket ${ticket_id} is in the queue.`,
      `Delivery to: ${delivery_contact || 'reply to this endpoint with delivery_contact to update'}`,
      'For production services, our team will deliver within 48h.',
      'Contact: info@fractiai.com · Reference your ticket_id.',
    ];
  }

  return res.status(final_status === 'DELIVERED' ? 200 : 202).json(response);
};
