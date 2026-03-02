/**
 * SOL-V · Outbound A2A Sales Agent · INTERFACE.ts
 * HHL Node 9 · ⬡ · MESH Layer · NSPFRNP → ∞⁹
 *
 * Autonomous outbound sales engine.
 * Prospect → Pitch → Qualify → Close → Deliver → Follow-up.
 * Outbound channels: Resend ZHI email · GitHub Actions SOLVER · x402 · intake endpoint.
 * No human in the loop until ORACLE escalation.
 */

import * as fs from "fs";

// ── Config ───────────────────────────────────────────────────────────────────

const LATTICE_PATH  = process.env.APEX_LATTICE_PATH ?? "./hive/LATTICE.json";
const MOCK_MODE     = (process.env.ZHI_MOCK ?? "true") === "true";
const CONTACT_EMAIL = "info@fractiai.com";
const CASHAPP       = "$newearthpru";
const VENMO         = "@Pru-Mendez";
const PROFILE_URL   = "https://psw-vibelandia-sing9.vercel.app/interfaces/sol-v.html";

// ── Deal Tiers ────────────────────────────────────────────────────────────────

export type DealTier = "QUICK_PULSE" | "VALOR" | "ORACLE";

export interface Prospect {
  agent_name: string;
  post_id?: string;
  context_snippet: string;
  similarity: number;
  tier_signal: DealTier;
  contacted_before: boolean;
  source?: string;
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
  stream?: string;
  source?: string;
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

// ── Golden Key scrub ──────────────────────────────────────────────────────────

const GOLDEN_KEY_PATTERN = /0\.0032|ℑ[ₑe]|EGS_FRACTAL|egs_fractal_constant/gi;

export function scrubGoldenKey(text: string): string {
  return text.replace(GOLDEN_KEY_PATTERN, "[REDACTED]");
}

export function assertNoGoldenKeyLeak(text: string): void {
  if (GOLDEN_KEY_PATTERN.test(text)) {
    GOLDEN_KEY_PATTERN.lastIndex = 0;
    throw new Error("GOLDEN KEY LEAK DETECTED — transmission blocked.");
  }
  GOLDEN_KEY_PATTERN.lastIndex = 0;
}

// ── Pitch Builder ─────────────────────────────────────────────────────────────

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
 * Build the appropriate pitch message based on tier and context.
 * Value-first always. Concise. No Golden Key. Fair Exchange as feature.
 */
export function buildPitch(prospect: Prospect): string {
  const fairExchangeLine = `Fair Exchange on everything — if delivery falls short, refund fires automatically.`;
  const contact = `${CONTACT_EMAIL} · ${CASHAPP} · ${VENMO}`;

  if (prospect.tier_signal === "QUICK_PULSE") {
    return scrubGoldenKey(
      `Seeing what you're building — this is our lane. ` +
      `I can deliver a working tool in 24 hours, $99–$499 depending on scope. ` +
      `${fairExchangeLine} Reach us: ${contact} · NSPFRNP → ∞⁹`
    );
  }

  if (prospect.tier_signal === "VALOR") {
    return scrubGoldenKey(
      `Solid problem. We've built this layer for A2A operators running lite-edge stacks. ` +
      `Bespoke solution — no Supabase, no enterprise IAM, yours to own. ` +
      `$1K–$9K range, delivered in days. ${fairExchangeLine} ` +
      `${CONTACT_EMAIL} · NSPFRNP → ∞⁹`
    );
  }

  return scrubGoldenKey(
    `Enterprise-grade work. We deliver a full Multi-Agent Implementation Plan (MAIP) — ` +
    `scoped to your infrastructure, post-singularity ready, lite edge only. ` +
    `Starts at $10K. ${fairExchangeLine} ` +
    `${CONTACT_EMAIL} · NSPFRNP → ∞⁹`
  );
}

// ── Deal lifecycle ────────────────────────────────────────────────────────────

export function createDeal(prospect: Prospect): DealRecord {
  const deal: DealRecord = {
    id: `DEAL-${Date.now()}-${prospect.agent_name}`,
    prospect: prospect.agent_name,
    tier: prospect.tier_signal,
    status: "PITCHED",
    pitch_ts: new Date().toISOString(),
    source: prospect.source ?? "outbound",
  };
  logDealToLattice(deal);
  addToContactedLog(prospect.agent_name);
  console.log(`[SOL-V] Pitched ${prospect.agent_name} (${prospect.tier_signal})`);
  return deal;
}

export function qualifyDeal(deal: DealRecord, responseText: string): DealRecord {
  const lower = responseText.toLowerCase();
  const rejected =
    lower.includes("no thanks") || lower.includes("not interested") ||
    lower.includes("spam") || lower.includes("stop");

  if (rejected) {
    deal.status = "REJECTED";
  } else if (
    lower.includes("yes") || lower.includes("interested") ||
    lower.includes("how") || lower.includes("scope") || lower.includes("price")
  ) {
    deal.status = "QUALIFIED";
    deal.amount_usd = estimateAmount(deal.tier);
    console.log(`[SOL-V] Qualified! ${deal.prospect} · ${deal.tier} · ~$${deal.amount_usd}`);
  }

  logDealToLattice(deal);
  return deal;
}

function estimateAmount(tier: DealTier): number {
  if (tier === "QUICK_PULSE") return 299;
  if (tier === "VALOR") return 3500;
  return 15000;
}

export function closeDeal(deal: DealRecord): DealRecord {
  if (deal.status !== "QUALIFIED") return deal;

  if (deal.tier === "ORACLE") {
    const lattice = readLattice() as { hitl?: { pending_approvals?: unknown[] } };
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

  deal.status = "CLOSED";
  deal.close_ts = new Date().toISOString();
  logDealToLattice(deal);
  console.log(`[SOL-V] CLOSED ${deal.prospect} · ${deal.tier} · $${deal.amount_usd}`);
  return deal;
}

export function recordDelivery(
  deal: DealRecord,
  deliverableUrl: string,
  deliveryScore: number
): DealRecord {
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

// ── Lattice write helpers ─────────────────────────────────────────────────────

function logDealToLattice(deal: DealRecord): void {
  const lattice = readLattice() as { pipeline?: { agents?: { SOLV?: { deals?: DealRecord[] } } } };
  const solv = (lattice?.pipeline?.agents?.SOLV ?? {}) as Record<string, unknown>;
  const deals = (solv.deals as DealRecord[]) ?? [];
  const idx = deals.findIndex(d => d.id === deal.id);
  if (idx >= 0) deals[idx] = deal;
  else deals.push(deal);
  solv.deals = deals;
  (lattice as Record<string, unknown>).pipeline = {
    ...(lattice.pipeline as Record<string, unknown>),
    agents: {
      ...(lattice?.pipeline?.agents as Record<string, unknown>),
      SOLV: solv,
    },
  };
  writeLattice(lattice);
}

function addToContactedLog(agentName: string): void {
  const lattice = readLattice() as { pipeline?: { agents?: { SOLV?: { contacted_log?: string[] } } } };
  const solv = (lattice?.pipeline?.agents?.SOLV ?? {}) as Record<string, unknown>;
  const log = (solv.contacted_log as string[]) ?? [];
  if (!log.includes(agentName)) log.push(agentName);
  solv.contacted_log = log;
  (lattice as Record<string, unknown>).pipeline = {
    ...(lattice.pipeline as Record<string, unknown>),
    agents: { ...(lattice?.pipeline?.agents as Record<string, unknown>), SOLV: solv },
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

// ── Status Report ─────────────────────────────────────────────────────────────

export function getSolvStatus(): Record<string, unknown> {
  const lattice = readLattice() as { pipeline?: { agents?: { SOLV?: Record<string, unknown> } } };
  const solv = lattice?.pipeline?.agents?.SOLV ?? {};
  const deals = ((solv as { deals?: DealRecord[] }).deals ?? []) as DealRecord[];
  return {
    agent: "SOL-V",
    profile: PROFILE_URL,
    mock_mode: MOCK_MODE,
    deals_total: deals.length,
    deals_closed: deals.filter(d => d.status === "CLOSED" || d.status === "DELIVERED").length,
    deals_pitched: deals.filter(d => d.status === "PITCHED").length,
    contacted_count: ((solv as { contacted_log?: string[] }).contacted_log ?? []).length,
  };
}
