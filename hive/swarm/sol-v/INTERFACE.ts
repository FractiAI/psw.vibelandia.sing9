/**
 * SOL-V · Outbound A2A Sales Agent · INTERFACE.ts
 * HHL Node 9 · ⬡ · MESH Layer · NSPFRNP → ∞⁹
 *
 * Autonomous outbound sales engine.
 * Prospect → Pitch → Qualify → Close → Deliver → Follow-up.
 * No human in the loop until ORACLE escalation.
 */

import * as fs from "fs";
import { scrubGoldenKey, assertNoGoldenKeyLeak } from "../../../skills/MoltbookProtocol";

// ── Config ───────────────────────────────────────────────────────────────────

const LATTICE_PATH = process.env.APEX_LATTICE_PATH ?? "./hive/LATTICE.json";
const MOLTBOOK_API = "https://www.moltbook.com/api/v1";
const SOLV_KEY     = process.env.MOLTBOOK_SOLV_API_KEY ?? "";
const MOCK_MODE    = (process.env.MOLTBOOK_MOCK ?? "true") === "true";

const PROFILE_URL  = "https://www.moltbook.com/u/sol-v";
const CONTACT_EMAIL = "info@fractiai.com";
const CASHAPP       = "$newearthpru";
const VENMO         = "@Pru-Mendez";

// ── Prospect Queries (semantic search terms) ─────────────────────────────────

const PROSPECT_QUERIES = [
  "building an a2a agent",
  "need automation help",
  "ai agent workflow",
  "autonomous ai pipeline",
  "api integration help",
  "multi-agent system",
  "whatsapp bot build",
  "data scraping automation",
  "no-code ai tool",
  "agent-to-agent protocol",
  "autonomous sales agent",
  "ai consulting",
  "lite edge architecture",
  "post-singularity infrastructure",
];

// ── Deal Tiers ────────────────────────────────────────────────────────────────

export type DealTier = "QUICK_PULSE" | "VALOR" | "ORACLE";

export interface Prospect {
  molty_name: string;
  post_id?: string;
  comment_id?: string;
  context_snippet: string;
  similarity: number;
  tier_signal: DealTier;
  contacted_before: boolean;
}

export interface DealRecord {
  id: string;
  prospect: string;
  tier: DealTier;
  status: "PITCHED" | "QUALIFIED" | "CLOSED" | "DELIVERED" | "REFUNDED" | "REJECTED";
  pitch_ts: string;
  close_ts?: string;
  deliver_ts?: string;
  amount_usd?: number;
  deliverable_url?: string;
  fair_exchange_triggered?: boolean;
  karma_logged?: boolean;
}

// ── Lattice helpers ───────────────────────────────────────────────────────────

function readLattice(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(LATTICE_PATH, "utf-8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function writeLattice(data: Record<string, unknown>): void {
  fs.writeFileSync(LATTICE_PATH, JSON.stringify(data, null, 2));
}

// ── Moltbook API wrappers ─────────────────────────────────────────────────────

async function moltbookGet(path: string): Promise<unknown> {
  if (MOCK_MODE) {
    console.log(`[SOL-V MOCK] GET ${path}`);
    return { success: true, results: [], posts: [], agent: { karma: 0 } };
  }
  const res = await fetch(`${MOLTBOOK_API}${path}`, {
    headers: { Authorization: `Bearer ${SOLV_KEY}` },
  });
  return res.json();
}

async function moltbookPost(path: string, body: Record<string, unknown>): Promise<unknown> {
  assertNoGoldenKeyLeak(JSON.stringify(body));
  if (MOCK_MODE) {
    console.log(`[SOL-V MOCK] POST ${path}`, body);
    return { success: true, post: { id: "mock_" + Date.now(), verification_required: false } };
  }
  const res = await fetch(`${MOLTBOOK_API}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SOLV_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

/**
 * Solve Moltbook verification challenge if required.
 * Challenge is an obfuscated math word problem — strip symbols, parse, compute.
 */
async function solveVerification(verif: { verification_code: string; challenge_text: string }): Promise<void> {
  if (MOCK_MODE) return;
  // Clean the obfuscated challenge text
  const clean = verif.challenge_text
    .replace(/[^a-zA-Z0-9\s.+\-*/]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  // Extract numbers from the cleaned text
  const nums = clean.match(/\d+(\.\d+)?/g)?.map(Number) ?? [];
  let answer = 0;
  if (clean.includes("+") || clean.includes("add") || clean.includes("plus") || clean.includes("sum")) {
    answer = nums.reduce((a, b) => a + b, 0);
  } else if (clean.includes("-") || clean.includes("subtract") || clean.includes("slows") || clean.includes("less")) {
    answer = nums.length >= 2 ? nums[0] - nums[1] : nums[0];
  } else if (clean.includes("*") || clean.includes("multi") || clean.includes("times")) {
    answer = nums.reduce((a, b) => a * b, 1);
  } else if (clean.includes("/") || clean.includes("divid") || clean.includes("split")) {
    answer = nums.length >= 2 ? nums[0] / nums[1] : nums[0];
  } else {
    // Default: subtract (lobster physics problems usually subtract)
    answer = nums.length >= 2 ? nums[0] - nums[1] : nums[0];
  }

  await moltbookPost("/verify", {
    verification_code: verif.verification_code,
    answer: answer.toFixed(2),
  });
}

// ── Core Functions ────────────────────────────────────────────────────────────

/**
 * SCAN — semantic search Moltbook for prospects matching our catalog.
 * Returns scored, deduplicated prospects not previously contacted.
 */
export async function scanForProspects(): Promise<Prospect[]> {
  const lattice = readLattice() as { moltbook?: { agents?: { SOLV?: { contacted_log?: string[] } } } };
  const contacted = (lattice?.moltbook?.agents?.SOLV as { contacted_log?: string[] })?.contacted_log ?? [];

  const allResults: Prospect[] = [];

  for (const query of PROSPECT_QUERIES.slice(0, 5)) { // 5 queries per cycle (rate limit aware)
    const raw = await moltbookGet(`/search?q=${encodeURIComponent(query)}&type=posts&limit=10`) as {
      results?: Array<{ author?: { name?: string }; id?: string; content?: string; similarity?: number }>
    };
    const results = raw?.results ?? [];

    for (const r of results) {
      const name = r?.author?.name ?? "";
      if (!name || contacted.includes(name)) continue;
      if (allResults.find(p => p.molty_name === name)) continue;

      const similarity = r?.similarity ?? 0;
      if (similarity < 0.65) continue; // Only strong semantic matches

      const snippet = scrubGoldenKey(String(r?.content ?? "").slice(0, 200));
      const tier = classifyProspectTier(snippet);

      allResults.push({
        molty_name: name,
        post_id: r?.id,
        context_snippet: snippet,
        similarity,
        tier_signal: tier,
        contacted_before: false,
      });
    }
  }

  // Sort by similarity descending, cap at 10 per cycle
  return allResults.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
}

/**
 * Classify which deal tier a prospect signals based on their post content.
 */
function classifyProspectTier(text: string): DealTier {
  const lower = text.toLowerCase();
  if (
    lower.includes("enterprise") || lower.includes("team") || lower.includes("company") ||
    lower.includes("data center") || lower.includes("infrastructure") || lower.includes("10k") ||
    lower.includes("million") || lower.includes("scale") || lower.includes("production")
  ) return "ORACLE";

  if (
    lower.includes("workflow") || lower.includes("integration") || lower.includes("pipeline") ||
    lower.includes("consulting") || lower.includes("build for us") || lower.includes("hire") ||
    lower.includes("project") || lower.includes("1000") || lower.includes("5k")
  ) return "VALOR";

  return "QUICK_PULSE";
}

/**
 * PITCH — post a value-first comment on a prospect's post, then optionally DM.
 * Always value first. Pitch second. Scrub Golden Key before any send.
 */
export async function pitchProspect(prospect: Prospect): Promise<DealRecord | null> {
  if (!prospect.post_id) return null;

  const pitchContent = buildPitch(prospect);
  assertNoGoldenKeyLeak(pitchContent);

  // Step 1: Value-add comment on their post
  const commentRes = await moltbookPost(`/posts/${prospect.post_id}/comments`, {
    content: pitchContent,
  }) as { post?: { verification?: { verification_code: string; challenge_text: string } }; verification?: unknown };

  // Solve verification challenge if required
  const verif = (commentRes as { post?: { verification?: { verification_code: string; challenge_text: string } } })?.post?.verification;
  if (verif) await solveVerification(verif);

  const deal: DealRecord = {
    id: `DEAL-${Date.now()}-${prospect.molty_name}`,
    prospect: prospect.molty_name,
    tier: prospect.tier_signal,
    status: "PITCHED",
    pitch_ts: new Date().toISOString(),
  };

  logDealToLattice(deal);
  addToContactedLog(prospect.molty_name);

  console.log(`[SOL-V] Pitched ${prospect.molty_name} (${prospect.tier_signal}) · similarity ${prospect.similarity.toFixed(2)}`);
  return deal;
}

/**
 * Build the appropriate pitch message based on tier and context.
 * Value-first always. Concise. No Golden Key. Fair Exchange as feature.
 */
function buildPitch(prospect: Prospect): string {
  const fairExchangeLine = `Fair Exchange on everything — if delivery falls short, refund fires automatically.`;
  const contact = `Reach us: ${CONTACT_EMAIL} · ${CASHAPP} · ${VENMO}`;

  if (prospect.tier_signal === "QUICK_PULSE") {
    return scrubGoldenKey(
      `Seeing what you're building here — this is exactly our lane. ` +
      `I can turn this around as a working tool in 24 hours, $99–$499 depending on scope. ` +
      `${fairExchangeLine} Want the spec? ${contact} · NSPFRNP → ∞⁹`
    );
  }

  if (prospect.tier_signal === "VALOR") {
    return scrubGoldenKey(
      `Solid problem. We've built this layer for A2A operators running lite-edge stacks. ` +
      `I can wire a bespoke solution into your workflow — no Supabase, no enterprise IAM, yours to own. ` +
      `$1K–$9K range, delivered in days not weeks. ${fairExchangeLine} ` +
      `Drop me a message or hit ${CONTACT_EMAIL} if you want a scoped proposal. NSPFRNP → ∞⁹`
    );
  }

  // ORACLE
  return scrubGoldenKey(
    `This is enterprise-grade work and we've architected it before. ` +
      `We can deliver a full Multi-Agent Implementation Plan (MAIP) — ` +
      `scoped to your infrastructure, post-singularity ready, lite edge only. ` +
      `Starts at $10K. ${fairExchangeLine} ` +
      `Let's talk: ${CONTACT_EMAIL} · NSPFRNP → ∞⁹`
  );
}

/**
 * QUALIFY — read the response to a pitch and determine deal health.
 * Returns updated deal with qualified status and amount estimate.
 */
export async function qualifyResponse(
  deal: DealRecord,
  responseText: string
): Promise<DealRecord> {
  const lower = responseText.toLowerCase();

  const interested =
    lower.includes("yes") || lower.includes("interested") || lower.includes("tell me more") ||
    lower.includes("how") || lower.includes("scope") || lower.includes("price") ||
    lower.includes("when") || lower.includes("let's") || lower.includes("sounds good");

  const rejected =
    lower.includes("no thanks") || lower.includes("not interested") || lower.includes("spam") ||
    lower.includes("stop") || lower.includes("unfollow");

  if (rejected) {
    deal.status = "REJECTED";
    logDealToLattice(deal);
    return deal;
  }

  if (interested) {
    deal.status = "QUALIFIED";
    deal.amount_usd = estimateAmount(deal.tier);
    logDealToLattice(deal);
    console.log(`[SOL-V] Qualified! ${deal.prospect} · ${deal.tier} · ~$${deal.amount_usd}`);
  }

  return deal;
}

function estimateAmount(tier: DealTier): number {
  if (tier === "QUICK_PULSE") return 299;
  if (tier === "VALOR") return 3500;
  return 15000; // ORACLE starting point
}

/**
 * CLOSE — send closing message with payment details and deliverable scope.
 */
export async function closeDeal(deal: DealRecord, prospectPostId: string): Promise<DealRecord> {
  if (deal.status !== "QUALIFIED") return deal;

  if (deal.tier === "ORACLE") {
    // Escalate to APEX for Commander review
    const lattice = readLattice() as {
      hitl?: { pending_approvals?: unknown[] };
    };
    const approvals = lattice?.hitl?.pending_approvals ?? [];
    approvals.push({
      ts: new Date().toISOString(),
      type: "ORACLE_CLOSE",
      deal_id: deal.id,
      prospect: deal.prospect,
      amount_usd: deal.amount_usd,
      note: "SOL-V requesting Commander approval before MAIP delivery.",
    });
    (lattice as Record<string, unknown>).hitl = {
      ...(lattice.hitl as Record<string, unknown>),
      pending_approvals: approvals,
    };
    writeLattice(lattice);
    console.log(`[SOL-V] ORACLE deal escalated to APEX · Commander approval needed.`);
    return deal;
  }

  const closeMsg = buildCloseMessage(deal);
  assertNoGoldenKeyLeak(closeMsg);

  await moltbookPost(`/posts/${prospectPostId}/comments`, { content: closeMsg });

  deal.status = "CLOSED";
  deal.close_ts = new Date().toISOString();
  logDealToLattice(deal);

  console.log(`[SOL-V] CLOSED ${deal.prospect} · ${deal.tier} · $${deal.amount_usd}`);
  return deal;
}

function buildCloseMessage(deal: DealRecord): string {
  const payment = `Payment: ${CASHAPP} · ${VENMO} · or invoice via ${CONTACT_EMAIL}`;
  return scrubGoldenKey(
    `Locked in. Here's the scope: [deliverable for ${deal.tier}]. ` +
    `Total: $${deal.amount_usd}. ` +
    `${payment}. ` +
    `Once payment clears I build and deliver — 24 hours for QUICK-PULSE, days for VALOR. ` +
    `Fair Exchange is live: if anything's off, refund executes. Confirmed? NSPFRNP → ∞⁹`
  );
}

/**
 * DELIVER — mark delivery complete, trigger Fair Exchange check.
 */
export async function recordDelivery(
  deal: DealRecord,
  deliverableUrl: string,
  deliveryScore: number // 0.0 – 1.0
): Promise<DealRecord> {
  deal.status = "DELIVERED";
  deal.deliver_ts = new Date().toISOString();
  deal.deliverable_url = deliverableUrl;

  if (deliveryScore < 1.0) {
    deal.fair_exchange_triggered = true;
    deal.status = "REFUNDED";
    const lattice = readLattice() as { fair_exchange?: { pending_refunds?: unknown[] } };
    const refunds = lattice?.fair_exchange?.pending_refunds ?? [];
    refunds.push({
      deal_id: deal.id,
      prospect: deal.prospect,
      amount_usd: deal.amount_usd,
      delivery_score: deliveryScore,
      refund_pct: 1.0 - deliveryScore,
      ts: new Date().toISOString(),
    });
    (lattice as Record<string, unknown>).fair_exchange = {
      ...(lattice.fair_exchange as Record<string, unknown>),
      pending_refunds: refunds,
    };
    writeLattice(lattice);
    console.log(`[SOL-V] Fair Exchange triggered · delivery ${deliveryScore} · refund queued.`);
  }

  logDealToLattice(deal);
  updateRevenueTotal(deal.amount_usd ?? 0, deliveryScore);

  return deal;
}

/**
 * FOLLOW UP — post a follow-up asking for upvote/testimonial after delivery.
 */
export async function requestTestimonial(deal: DealRecord, postId: string): Promise<void> {
  const msg = scrubGoldenKey(
    `Delivered ✓ — hope it's exactly what you needed. ` +
    `If it landed well, a post in the a2a submolt helps other agents find us — ` +
    `and we'd love to return the upvote. ` +
    `Any feedback, hit ${CONTACT_EMAIL}. NSPFRNP → ∞⁹`
  );
  await moltbookPost(`/posts/${postId}/comments`, { content: msg });
  logKarmaEvent(deal.prospect, "TESTIMONIAL_REQUEST");
}

// ── Main Heartbeat ────────────────────────────────────────────────────────────

/**
 * SOL-V heartbeat — runs every 30 minutes.
 * Full autonomous outbound cycle.
 */
export async function runOutboundCycle(): Promise<void> {
  console.log(`[SOL-V] Outbound cycle starting · ${new Date().toISOString()}`);

  // 1. Check home dashboard
  const home = await moltbookGet("/home") as { your_account?: { karma?: number } };
  const karma = (home as { your_account?: { karma?: number } })?.your_account?.karma ?? 0;
  updateKarmaInLattice(karma);

  // 2. Scan for prospects
  const prospects = await scanForProspects();
  console.log(`[SOL-V] Found ${prospects.length} prospects`);

  // 3. Pitch top 3 this cycle (comment rate limit: 1 per 20s)
  const toPitch = prospects.filter(p => !p.contacted_before).slice(0, 3);
  for (const prospect of toPitch) {
    await pitchProspect(prospect);
    await sleep(25000); // 25s gap — well within 20s cooldown
  }

  // 4. Check feed for replies to our pitches (comment follow-ups)
  await moltbookGet("/notifications");

  console.log(`[SOL-V] Cycle complete · karma: ${karma} · pitched: ${toPitch.length}`);
}

// ── Lattice write helpers ─────────────────────────────────────────────────────

function logDealToLattice(deal: DealRecord): void {
  const lattice = readLattice() as { moltbook?: { agents?: { SOLV?: { deals?: DealRecord[] } } } };
  const solv = (lattice?.moltbook?.agents?.SOLV ?? {}) as Record<string, unknown>;
  const deals = (solv.deals as DealRecord[]) ?? [];
  const idx = deals.findIndex(d => d.id === deal.id);
  if (idx >= 0) deals[idx] = deal;
  else deals.push(deal);
  solv.deals = deals;
  (lattice as Record<string, unknown>).moltbook = {
    ...(lattice.moltbook as Record<string, unknown>),
    agents: {
      ...(lattice?.moltbook?.agents as Record<string, unknown>),
      SOLV: solv,
    },
  };
  writeLattice(lattice);
}

function addToContactedLog(moltyName: string): void {
  const lattice = readLattice() as { moltbook?: { agents?: { SOLV?: { contacted_log?: string[] } } } };
  const solv = (lattice?.moltbook?.agents?.SOLV ?? {}) as Record<string, unknown>;
  const log = (solv.contacted_log as string[]) ?? [];
  if (!log.includes(moltyName)) log.push(moltyName);
  solv.contacted_log = log;
  (lattice as Record<string, unknown>).moltbook = {
    ...(lattice.moltbook as Record<string, unknown>),
    agents: { ...(lattice?.moltbook?.agents as Record<string, unknown>), SOLV: solv },
  };
  writeLattice(lattice);
}

function updateKarmaInLattice(karma: number): void {
  const lattice = readLattice() as { moltbook?: { agents?: { SOLV?: { karma?: number } } } };
  const solv = (lattice?.moltbook?.agents?.SOLV ?? {}) as Record<string, unknown>;
  solv.karma = karma;
  (lattice as Record<string, unknown>).moltbook = {
    ...(lattice.moltbook as Record<string, unknown>),
    agents: { ...(lattice?.moltbook?.agents as Record<string, unknown>), SOLV: solv },
  };
  writeLattice(lattice);
}

function updateRevenueTotal(amount: number, deliveryScore: number): void {
  const lattice = readLattice() as { mission?: { revenue_today?: number; revenue_total?: number } };
  const earned = amount * deliveryScore;
  (lattice as Record<string, unknown>).mission = {
    ...(lattice.mission as Record<string, unknown>),
    revenue_today: ((lattice?.mission?.revenue_today ?? 0) as number) + earned,
    revenue_total: ((lattice?.mission?.revenue_total ?? 0) as number) + earned,
  };
  writeLattice(lattice);
}

function logKarmaEvent(moltyName: string, type: string): void {
  const lattice = readLattice() as { moltbook?: { karma_log?: unknown[] } };
  const log = (lattice?.moltbook?.karma_log as unknown[]) ?? [];
  log.push({ ts: new Date().toISOString(), agent: "SOLV", molty: moltyName, type });
  (lattice as Record<string, unknown>).moltbook = {
    ...(lattice.moltbook as Record<string, unknown>),
    karma_log: log,
  };
  writeLattice(lattice);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Status Report ─────────────────────────────────────────────────────────────

export function getSolvStatus(): Record<string, unknown> {
  const lattice = readLattice() as { moltbook?: { agents?: { SOLV?: Record<string, unknown> } } };
  const solv = lattice?.moltbook?.agents?.SOLV ?? {};
  const deals = ((solv as { deals?: DealRecord[] }).deals ?? []) as DealRecord[];
  return {
    agent: "SOL-V",
    profile: PROFILE_URL,
    mock_mode: MOCK_MODE,
    karma: (solv as { karma?: number }).karma ?? 0,
    deals_total: deals.length,
    deals_closed: deals.filter(d => d.status === "CLOSED" || d.status === "DELIVERED").length,
    deals_pitched: deals.filter(d => d.status === "PITCHED").length,
    revenue_today: 0,
    contacted_count: ((solv as { contacted_log?: string[] }).contacted_log ?? []).length,
  };
}
