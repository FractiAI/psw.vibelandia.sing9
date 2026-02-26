/**
 * APEX · INTERFACE.ts
 * Node 1 · ◎ SEED · The Source · HITL Gateway
 * /hive/principals/apex/INTERFACE.ts
 *
 * Tooling interface for the APEX principal agent.
 * Handles inbound Commander messages (WhatsApp / Telegram / CLI),
 * routes executive commands to the correct node, and manages
 * biometric handshake for ORACLE tier unlock.
 *
 * NSPFRNP → ∞⁹
 */

import { buildA2AMetadata } from '../../utils/FairExchange';
import * as fs from 'fs';
import * as path from 'path';

/* ── CONSTANTS ───────────────────────────────────────────────────────────── */

export const AGENT_ID = 'APEX';
export const HHL_NODE = 1;
export const LATTICE_PATH = path.resolve(__dirname, '../../LATTICE.json');

/* ── TYPES ───────────────────────────────────────────────────────────────── */

export type Channel = 'whatsapp' | 'telegram' | 'cli';

export type CommandCategory =
  | 'REVENUE'
  | 'BUILD'
  | 'SOLAR'
  | 'A2A'
  | 'FAIR_EXCHANGE'
  | 'MISSION_LOG'
  | 'THERMAL'
  | 'BIOMETRIC_HANDSHAKE'
  | 'LATTICE_QUERY'
  | 'UNCLASSIFIED';

export interface InboundMessage {
  channel: Channel;
  commander_id: string;
  text: string;
  timestamp: string;
  raw?: unknown;
}

export interface RoutedCommand {
  message: InboundMessage;
  category: CommandCategory;
  destination_node: string;      /* e.g. 'VALOR', 'SYNC', 'ORACLE' */
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  biometric_required: boolean;
  biometric_cleared: boolean;
  a2a_metadata: ReturnType<typeof buildA2AMetadata>;
}

export interface ApexStatus {
  online: boolean;
  channel: Channel;
  last_commander_ping: string | null;
  pending_approvals: number;
  closes_today: number;
  lattice_node_count: number;
}

/* ── SIGNAL PATTERNS ─────────────────────────────────────────────────────── */

const ROUTING_TABLE: Array<{ patterns: RegExp[]; destination: string; category: CommandCategory }> = [
  {
    patterns: [/revenue|close|deal|prospect|sale|client|payment|venmo|cash.?app/i],
    destination: 'SWARM_ROUTER',
    category: 'REVENUE',
  },
  {
    patterns: [/build|create|refactor|code|cursor|deploy|scaffold/i],
    destination: 'FLOW',
    category: 'BUILD',
  },
  {
    patterns: [/solar|sunspot|egs|ar4366|flare|limb|0\.0032|fractal.?constant/i],
    destination: 'SYNC',
    category: 'SOLAR',
  },
  {
    patterns: [/a2a|mesh|handshake|tribal|node|agent.?to.?agent|sol-v/i],
    destination: 'MESH',
    category: 'A2A',
  },
  {
    patterns: [/refund|fair.?exchange|void|fair.?shake/i],
    destination: 'VOID',
    category: 'FAIR_EXCHANGE',
  },
  {
    patterns: [/log|report|atlas|mission.?day|debrief/i],
    destination: 'ATLAS',
    category: 'MISSION_LOG',
  },
  {
    patterns: [/thermal|drift|resonance|mass|temperature|83/i],
    destination: 'MASS',
    category: 'THERMAL',
  },
  {
    patterns: [/lattice|status|nodes|hive|how many|what.?is.?running/i],
    destination: 'APEX',
    category: 'LATTICE_QUERY',
  },
];

/* ── CORE FUNCTIONS ──────────────────────────────────────────────────────── */

/** Read current LATTICE state */
export function readLattice(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(LATTICE_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

/** Patch a value into LATTICE.json */
export function writeLattice(patch: Record<string, unknown>): void {
  const current = readLattice();
  const updated = deepMerge(current, patch);
  fs.writeFileSync(LATTICE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
}

/** Classify and route an inbound Commander message */
export function routeMessage(msg: InboundMessage): RoutedCommand {
  const txId = `APEX-${Date.now()}`;
  let category: CommandCategory = 'UNCLASSIFIED';
  let destination = 'APEX';

  for (const rule of ROUTING_TABLE) {
    if (rule.patterns.some(p => p.test(msg.text))) {
      category = rule.category;
      destination = rule.destination;
      break;
    }
  }

  /* Biometric check for ORACLE */
  const lattice = readLattice() as any;
  const biometric_cleared = lattice?.swarm?.ORACLE?.biometric_cleared ?? false;
  const biometric_required = destination === 'ORACLE' || category === 'REVENUE';

  const routed: RoutedCommand = {
    message: msg,
    category,
    destination_node: destination,
    priority: category === 'REVENUE' || category === 'BIOMETRIC_HANDSHAKE' ? 'HIGH' : 'NORMAL',
    biometric_required,
    biometric_cleared,
    a2a_metadata: buildA2AMetadata(txId, AGENT_ID),
  };

  /* Log to LATTICE */
  writeLattice({
    hitl: {
      apex_online: true,
      last_commander_ping: msg.timestamp,
    },
  });

  return routed;
}

/** Validate biometric handshake — unlocks ORACLE tier */
export function validateBiometric(candidate: string): boolean {
  const expected = process.env['APEX_BIOMETRIC_KEY'];
  if (!expected) {
    console.warn('APEX: APEX_BIOMETRIC_KEY not set. Biometric validation disabled.');
    return false;
  }
  const match = candidate.trim() === expected.trim();
  if (match) {
    writeLattice({ swarm: { ORACLE: { biometric_cleared: true } } });
    console.log('APEX: Biometric handshake CONFIRMED. ORACLE tier unlocked.');
  }
  return match;
}

/** Format a response for WhatsApp / Telegram — NSPFRNP voice */
export function formatApexResponse(routed: RoutedCommand): string {
  const lattice = readLattice() as any;
  const closes = lattice?.mission?.revenue_today ?? 0;
  const nodes = Object.values(lattice?.nodes ?? {}).filter((n: any) => n.status === 'RUNNING').length;

  return [
    `Received. → ${routed.destination_node}.`,
    `Category: ${routed.category}.`,
    `LATTICE: ${nodes}/9 nodes live · ${closes} closes today.`,
    `NSPFRNP → ∞⁹`,
  ].join(' ');
}

/** Get current APEX status for dashboard */
export function getApexStatus(): ApexStatus {
  const lattice = readLattice() as any;
  return {
    online: true,
    channel: (process.env['APEX_CHANNEL'] as Channel) || 'cli',
    last_commander_ping: lattice?.hitl?.last_commander_ping ?? null,
    pending_approvals: (lattice?.hitl?.pending_approvals ?? []).length,
    closes_today: lattice?.mission?.revenue_today ?? 0,
    lattice_node_count: Object.keys(lattice?.nodes ?? {}).length,
  };
}

/* ── UTILITY ─────────────────────────────────────────────────────────────── */

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(
        (target[key] as Record<string, unknown>) || {},
        source[key] as Record<string, unknown>
      );
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
