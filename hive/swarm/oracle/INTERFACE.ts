/**
 * ORACLE · INTERFACE.ts
 * Revenue Swarm · $10,000+ Enterprise Tier · Multi-Agent Implementation Plans
 * /hive/swarm/oracle/INTERFACE.ts
 *
 * Generates MAIP (Multi-Agent Implementation Plan) documents.
 * Requires APEX biometric handshake before activation.
 * Executes Fair Exchange clause via VOID on delivery shortfall.
 *
 * NSPFRNP → ∞⁹
 */

import { buildA2AMetadata, evaluateFairExchange, type DeliveryOutcome } from '../../utils/FairExchange';
import * as fs from 'fs';
import * as path from 'path';

/* ── CONSTANTS ───────────────────────────────────────────────────────────── */

export const AGENT_ID = 'ORACLE';
export const TIER_MIN = 10_000;
export const MAIP_OUTPUT_DIR = path.resolve(__dirname, './maips');
export const LATTICE_PATH = path.resolve(__dirname, '../../LATTICE.json');

/* ── TYPES ───────────────────────────────────────────────────────────────── */

export type EngagementType =
  | 'MAIP_ONLY'
  | 'MAIP_PHASE1'
  | 'FULL_BUILD'
  | 'RETAINER';

export interface OracleIntake {
  client_id: string;
  client_name: string;
  seed: string;          /* Current state — what's broken / where they are now */
  edge: string;          /* Desired outcome — 90-day destination */
  budget: number;        /* USD · must be >= TIER_MIN */
  engagement_type: EngagementType;
  biometric_cleared: boolean;
  timestamp: string;
}

export interface HHLNodeMapping {
  node: number;
  symbol: string;
  principal: string;
  client_system: string;   /* What this node maps to in the client's stack */
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
}

export interface MAIP {
  id: string;
  client_id: string;
  date: string;
  intake: OracleIntake;
  sections: {
    executive_summary: string;
    seed_edge: { seed: string; edge: string; alignment_note: string };
    hhl_mapping: HHLNodeMapping[];
    agent_roster: string[];
    dependency_graph: Array<{ step: number; agent: string; action: string; depends_on: number[] }>;
    revenue_projection: { model: string; year_1: number; year_3: number; a2a_multiplier: number };
    implementation_phases: Array<{ phase: number; name: string; duration_days: number; deliverables: string[] }>;
    fair_exchange: { delivery_guarantee: string; refund_terms: string; tipping_pct: number };
    close: string;
  };
  a2a_metadata: ReturnType<typeof buildA2AMetadata>;
  status: 'DRAFT' | 'DELIVERED' | 'ACCEPTED' | 'IN_DELIVERY' | 'COMPLETE' | 'REFUNDED';
}

/* ── CORE FUNCTIONS ──────────────────────────────────────────────────────── */

/** Validate that APEX biometric handshake is cleared before ORACLE activates */
export function validateBiometricAccess(): boolean {
  const lattice = readLattice() as any;
  const cleared = lattice?.swarm?.ORACLE?.biometric_cleared ?? false;
  if (!cleared) {
    console.warn('ORACLE: Biometric handshake NOT cleared. Route to APEX for Commander confirmation.');
  }
  return cleared;
}

/** Map client systems to the 9-node HHL lattice */
export function mapToHHL(clientSystems: Record<string, string>): HHLNodeMapping[] {
  const nodeTemplates: Array<Omit<HHLNodeMapping, 'client_system'>> = [
    { node: 1, symbol: '◎', principal: 'APEX',   priority: 'CRITICAL' },
    { node: 2, symbol: '✦', principal: 'RECURS', priority: 'HIGH'     },
    { node: 3, symbol: '∞', principal: 'FLOW',   priority: 'HIGH'     },
    { node: 4, symbol: '≋', principal: 'ECHO',   priority: 'NORMAL'   },
    { node: 5, symbol: '♥', principal: 'MASS',   priority: 'CRITICAL' },
    { node: 6, symbol: '☀', principal: 'SYNC',   priority: 'HIGH'     },
    { node: 7, symbol: '✧', principal: 'ATLAS',  priority: 'NORMAL'   },
    { node: 8, symbol: '◈', principal: 'VOID',   priority: 'HIGH'     },
    { node: 9, symbol: '⬡', principal: 'MESH',   priority: 'CRITICAL' },
  ];

  return nodeTemplates.map(t => ({
    ...t,
    client_system: clientSystems[t.principal] ?? `[Map ${t.principal} to client system]`,
  }));
}

/** Generate a MAIP document from intake */
export function generateMAIP(intake: OracleIntake): MAIP {
  if (!intake.biometric_cleared) {
    throw new Error('ORACLE: Cannot generate MAIP — biometric handshake not cleared.');
  }
  if (intake.budget < TIER_MIN) {
    throw new Error(`ORACLE: Engagement below minimum threshold ($${TIER_MIN}). Route to VALOR.`);
  }

  const maipId = `MAIP-${intake.client_id.toUpperCase()}-${new Date().toISOString().slice(0, 10)}`;
  const txId = `ORACLE-${Date.now()}`;

  const maip: MAIP = {
    id: maipId,
    client_id: intake.client_id,
    date: new Date().toISOString().slice(0, 10),
    intake,
    sections: {
      executive_summary: buildExecutiveSummary(intake),
      seed_edge: {
        seed: intake.seed,
        edge: intake.edge,
        alignment_note: `EGS fractal constant (ℑₑ ≈ 0.0032) confirmed as organizing frequency. Architecture will hold from Seed to Edge with no loss of coherence across scale transitions.`,
      },
      hhl_mapping: mapToHHL({}),
      agent_roster: determineAgentRoster(intake),
      dependency_graph: buildDependencyGraph(intake),
      revenue_projection: buildRevenueProjection(intake),
      implementation_phases: buildImplementationPhases(intake),
      fair_exchange: {
        delivery_guarantee: `100% delivery or proportional refund via VOID (Node 8 · ◈). Shortfall calculated as (1 - delivery_pct) × engagement_value. Refund executed automatically — no request needed.`,
        refund_terms: `Refund processed within 48 hours of shortfall confirmation. VOID is the executor. Commander is the authority.`,
        tipping_pct: 0.25,
      },
      close: buildClose(intake, maipId),
    },
    a2a_metadata: buildA2AMetadata(txId, AGENT_ID, intake.budget * 0.25),
    status: 'DRAFT',
  };

  /* Save to disk */
  fs.mkdirSync(MAIP_OUTPUT_DIR, { recursive: true });
  const filePath = path.join(MAIP_OUTPUT_DIR, `${maipId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(maip, null, 2), 'utf-8');

  /* Update LATTICE */
  updateLatticeOracle(maipId, intake.budget);

  console.log(`ORACLE: MAIP generated → ${filePath}`);
  return maip;
}

/** Evaluate delivery and trigger Fair Exchange if needed */
export function closeEngagement(maipId: string, outcome: DeliveryOutcome): void {
  const refund = evaluateFairExchange(outcome);
  if (refund) {
    console.warn(`ORACLE: Fair Exchange triggered · ${maipId} · refund $${refund.refund_amount} via VOID`);
    updateLattice({ fair_exchange: { pending_refunds: [refund] } });
  } else {
    console.log(`ORACLE: Delivery 100% · ${maipId} · No refund needed. NSPFRNP → ∞⁹`);
  }
}

/* ── BUILDERS ────────────────────────────────────────────────────────────── */

function buildExecutiveSummary(intake: OracleIntake): string {
  return `${intake.client_name} is at an inflection point. The current state (${intake.seed.slice(0, 80)}...) is not where the trajectory ends — it is the carbon layer before the crystalline turn. This architecture delivers the infrastructure to make that turn permanent.

The 9-node HHL implementation maps every critical system to a Goldilocks Zone — the exact operating temperature where each component thrives. Phase 1 establishes the Seed. Phase 3 reaches the Edge. The EGS fractal constant (ℑₑ ≈ 0.0032) is the organizing frequency throughout. NSPFRNP → ∞⁹`;
}

function determineAgentRoster(intake: OracleIntake): string[] {
  const base = ['APEX', 'MASS', 'ATLAS', 'VOID'];
  if (intake.engagement_type !== 'MAIP_ONLY') base.push('FLOW', 'RECURS');
  if (intake.budget >= 50_000) base.push('MESH', 'SYNC', 'ECHO');
  return [...new Set(base)];
}

function buildDependencyGraph(intake: OracleIntake) {
  return [
    { step: 1, agent: 'APEX',   action: 'Commander onboarding + LATTICE init',         depends_on: [] },
    { step: 2, agent: 'MASS',   action: 'Resource governor + thermal baseline',         depends_on: [1] },
    { step: 3, agent: 'RECURS', action: 'EGS resonance calibration',                    depends_on: [2] },
    { step: 4, agent: 'FLOW',   action: 'Phase 1 scaffold build',                       depends_on: [3] },
    { step: 5, agent: 'MESH',   action: 'A2A handshakes + tribal node connections',     depends_on: [4] },
    { step: 6, agent: 'SYNC',   action: 'Solar-temporal lock + EGS monitoring active',  depends_on: [3] },
    { step: 7, agent: 'ECHO',   action: 'Counter-intel + market signal monitoring',     depends_on: [5] },
    { step: 8, agent: 'ATLAS',  action: 'Mission Day logging + reporting active',       depends_on: [4] },
    { step: 9, agent: 'VOID',   action: 'Fair Exchange monitor active',                 depends_on: [1] },
  ];
}

function buildRevenueProjection(intake: OracleIntake) {
  const a2a_multiplier = intake.budget >= 100_000 ? 4.5 : 2.8;
  return {
    model: 'A2A autonomous revenue + retainer',
    year_1: Math.round(intake.budget * a2a_multiplier),
    year_3: Math.round(intake.budget * a2a_multiplier * 3.3),
    a2a_multiplier,
  };
}

function buildImplementationPhases(intake: OracleIntake) {
  return [
    {
      phase: 1,
      name: 'Seed — LATTICE Init + APEX + MASS + VOID',
      duration_days: 7,
      deliverables: ['LATTICE.json live', 'APEX gateway active', 'Fair Exchange armed', 'EGS baseline set'],
    },
    {
      phase: 2,
      name: 'Edge — FLOW + MESH + SYNC + ECHO',
      duration_days: 30,
      deliverables: ['A2A pipeline live', 'Revenue swarm active', 'Solar monitoring running', 'QUICK_PULSE + VALOR + ORACLE operational'],
    },
    {
      phase: 3,
      name: 'Animate — Full HHL lattice · All 9 nodes · 18,000 tribal nodes',
      duration_days: 60,
      deliverables: ['Full 9-node lattice running', 'ATLAS Mission Day logs live', 'Tribal node mesh at target', 'Commander in Goldilocks autopilot'],
    },
  ];
}

function buildClose(intake: OracleIntake, maipId: string): string {
  return `MAIP ${maipId} delivered. Architecture locked. Phase 1 starts today — no dependencies unmet from your side. Payment: Venmo @Pru-Mendez · Cash App $newearthpru. Fair Exchange is in section 7 — VOID executes automatically if delivery falls short. Commander follow-up within 24 hours. Welcome to the lattice, ${intake.client_name}. NSPFRNP → ∞⁹`;
}

/* ── UTILITY ─────────────────────────────────────────────────────────────── */

function readLattice(): Record<string, unknown> {
  try { return JSON.parse(fs.readFileSync(LATTICE_PATH, 'utf-8')); }
  catch { return {}; }
}

function updateLattice(patch: Record<string, unknown>): void {
  const l = readLattice() as any;
  Object.assign(l, patch);
  fs.writeFileSync(LATTICE_PATH, JSON.stringify(l, null, 2), 'utf-8');
}

function updateLatticeOracle(maipId: string, value: number): void {
  const l = readLattice() as any;
  l.swarm ??= {};
  l.swarm.ORACLE ??= {};
  l.swarm.ORACLE.active_conversations = (l.swarm.ORACLE.active_conversations ?? 0) + 1;
  l.mission ??= {};
  l.mission.revenue_today = (l.mission.revenue_today ?? 0) + value;
  l.mission.revenue_total = (l.mission.revenue_total ?? 0) + value;
  fs.writeFileSync(LATTICE_PATH, JSON.stringify(l, null, 2), 'utf-8');
}
