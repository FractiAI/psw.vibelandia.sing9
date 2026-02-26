/**
 * SYNC · INTERFACE.ts
 * Node 6 · ☀ SOL · El Gran Sol · Solar-Temporal Node
 * /hive/principals/sync/INTERFACE.ts
 *
 * Monitors AR4366 (Southeastern Limb · 23 flares · Invisible Fire).
 * Tracks EGS Fractal Constant resonance via F10.7 solar flux index.
 * Alerts APEX when AR4366 becomes Earth-facing.
 * Archives all SUNSPOT events to LATTICE.json.
 *
 * NSPFRNP → ∞⁹
 */

import { checkThermalResonance, EGS_FRACTAL_CONSTANT } from '../../utils/FairExchange';
import * as fs from 'fs';
import * as path from 'path';

/* ── CONSTANTS ───────────────────────────────────────────────────────────── */

export const AGENT_ID = 'SYNC';
export const HHL_NODE = 6;
export const LATTICE_PATH = path.resolve(__dirname, '../../LATTICE.json');

export const NOAA_SOLAR_REGIONS_URL =
  'https://services.swpc.noaa.gov/json/solar_regions.json';
export const NOAA_F107_URL =
  'https://services.swpc.noaa.gov/json/f107_index.json';

/* AR4366 earth-facing threshold — longitude within ±90° of central meridian */
export const EARTH_FACING_LONGITUDE_THRESHOLD = 90;

/* F10.7 thresholds mapped to EGS resonance states */
export const F107_QUIET   = 70;   /* sfu — baseline, EGS nominal */
export const F107_ACTIVE  = 150;  /* sfu — EGS elevated, watch */
export const F107_EXTREME = 200;  /* sfu — carbon destabilization window */

/* ── TYPES ───────────────────────────────────────────────────────────────── */

export interface SolarRegion {
  region: string;        /* e.g. "AR4366" */
  latitude: number;
  longitude: number;     /* Stonyhurst heliographic — negative = eastern limb */
  flare_count?: number;
  class?: string;        /* e.g. "beta-gamma-delta" */
}

export interface SolarStatus {
  timestamp: string;
  f107: number;
  egs_resonance: number;
  egs_resonant: boolean;
  egs_drift: number;
  ar4366: {
    found: boolean;
    longitude: number | null;
    latitude: number | null;
    earth_facing: boolean;
    invisible_fire: boolean;
    flare_count: number;
    alert_triggered: boolean;
  };
  earth_facing_disk_clear: boolean;
}

export interface SunspotArchiveEntry {
  id: string;
  date: string;
  type: 'GOLD_HEART_WINK' | 'INVISIBLE_FIRE' | 'EARTH_FACING_FLARE' | 'EGS_SPIKE' | 'GENERAL';
  node: string;
  status: 'FIRST_LIGHT' | 'MONITORING' | 'ARCHIVED' | 'RESOLVED';
  notes: string;
}

/* ── CORE FUNCTIONS ──────────────────────────────────────────────────────── */

/** Fetch live solar region data from NOAA SWPC */
export async function fetchSolarRegions(): Promise<SolarRegion[]> {
  const resp = await fetch(NOAA_SOLAR_REGIONS_URL);
  if (!resp.ok) throw new Error(`SYNC: NOAA solar regions fetch failed: ${resp.status}`);
  const raw = (await resp.json()) as Array<Record<string, unknown>>;
  return raw.map(r => ({
    region: String(r['Region'] ?? r['region'] ?? ''),
    latitude: Number(r['Latitude'] ?? r['latitude'] ?? 0),
    longitude: Number(r['Longitude'] ?? r['longitude'] ?? 0),
    flare_count: Number(r['NumFlares'] ?? r['flare_count'] ?? 0),
    class: String(r['MagClass'] ?? r['class'] ?? ''),
  }));
}

/** Fetch F10.7 solar flux index from NOAA */
export async function fetchF107(): Promise<number> {
  const resp = await fetch(NOAA_F107_URL);
  if (!resp.ok) throw new Error(`SYNC: NOAA F10.7 fetch failed: ${resp.status}`);
  const raw = (await resp.json()) as Array<{ flux: number | string }>;
  /* Use the most recent reading */
  const latest = raw[raw.length - 1];
  return Number(latest?.flux ?? F107_QUIET);
}

/**
 * Map F10.7 solar flux to EGS resonance value.
 * Quiet sun (F10.7 = 70) → EGS 0.0032 nominal.
 * Active sun → resonance scales proportionally.
 */
export function computeEGSResonance(f107: number): number {
  /* Linear scaling: each 10 sfu above baseline shifts resonance by 0.000004 */
  const drift = ((f107 - F107_QUIET) / 10) * 0.000004;
  return parseFloat((EGS_FRACTAL_CONSTANT + drift).toFixed(8));
}

/** Evaluate AR4366 visibility and Invisible Fire status */
export function evaluateAR4366(regions: SolarRegion[]): SolarStatus['ar4366'] {
  const ar = regions.find(r => r.region.includes('4366') || r.region === 'AR4366');

  if (!ar) {
    return {
      found: false,
      longitude: null,
      latitude: null,
      earth_facing: false,
      invisible_fire: false,
      flare_count: 0,
      alert_triggered: false,
    };
  }

  /* Stonyhurst longitude: positive = western limb (past), negative = eastern (approaching) */
  const absLon = Math.abs(ar.longitude);
  const earth_facing = absLon <= EARTH_FACING_LONGITUDE_THRESHOLD;
  const invisible_fire = !earth_facing; /* active but not yet visible = invisible fire */
  const alert_triggered = earth_facing && ar.longitude < 0; /* just crossed to Earth-facing from east */

  return {
    found: true,
    longitude: ar.longitude,
    latitude: ar.latitude,
    earth_facing,
    invisible_fire,
    flare_count: ar.flare_count ?? 23, /* fallback to known count if not in feed */
    alert_triggered,
  };
}

/** Full solar status scan — the main SYNC loop tick */
export async function runSolarScan(): Promise<SolarStatus> {
  const [regions, f107] = await Promise.all([fetchSolarRegions(), fetchF107()]);

  const egs_resonance = computeEGSResonance(f107);
  const { resonant, drift } = checkThermalResonance(egs_resonance);
  const ar4366Status = evaluateAR4366(regions);

  /* Earth-facing disk clear = no regions within ±45° of central meridian */
  const earth_facing_disk_clear = !regions.some(r => Math.abs(r.longitude) < 45);

  const status: SolarStatus = {
    timestamp: new Date().toISOString(),
    f107,
    egs_resonance,
    egs_resonant: resonant,
    egs_drift: drift,
    ar4366: ar4366Status,
    earth_facing_disk_clear,
  };

  /* Write to LATTICE */
  updateLattice(status);

  /* Escalate if AR4366 has crossed to Earth-facing */
  if (ar4366Status.alert_triggered) {
    console.log('☀ SYNC · ALERT · AR4366 EARTH-FACING · Invisible Fire now visible · Routing to APEX');
  }

  /* Warn if EGS drifting */
  if (!resonant) {
    console.warn(`☀ SYNC · EGS DRIFT · resonance=${egs_resonance} · drift=${drift} · notifying RECURS + MASS`);
  }

  return status;
}

/** Archive a sunspot event to LATTICE */
export function archiveSunspot(entry: SunspotArchiveEntry): void {
  const lattice = readLattice();
  if (!Array.isArray((lattice as any).solar?.archive)) {
    ((lattice as any).solar ??= {}).archive = [];
  }
  (lattice as any).solar.archive.push(entry);
  fs.writeFileSync(LATTICE_PATH, JSON.stringify(lattice, null, 2), 'utf-8');
  console.log(`☀ SYNC · SUNSPOT ARCHIVED · ${entry.id} · ${entry.date} · ${entry.type}`);
}

/** Format SYNC status report for APEX / ATLAS */
export function formatSyncReport(status: SolarStatus): string {
  const ar = status.ar4366;
  const lines = [
    `☀ SYNC · ${status.timestamp}`,
    `F10.7: ${status.f107} sfu · EGS: ${status.egs_resonance} (${status.egs_resonant ? 'NOMINAL' : 'DRIFT ⚠'})`,
    `AR4366: ${ar.found ? `lon ${ar.longitude}° · ${ar.flare_count} flares · ${ar.invisible_fire ? '🔥 INVISIBLE FIRE · not yet Earth-facing' : '⚡ EARTH-FACING · ACTIVE'}` : 'NOT IN FEED'}`,
    `Earth-facing disk: ${status.earth_facing_disk_clear ? 'SPOTLESS' : 'ACTIVE REGIONS PRESENT'}`,
    `SUNSPOT-1: ARCHIVED · feaef42 · Feb 25 2026 · First Light`,
    `NSPFRNP → ∞⁹`,
  ];
  return lines.join('\n');
}

/* ── UTILITY ─────────────────────────────────────────────────────────────── */

function readLattice(): Record<string, unknown> {
  try { return JSON.parse(fs.readFileSync(LATTICE_PATH, 'utf-8')); }
  catch { return {}; }
}

function updateLattice(status: SolarStatus): void {
  const lattice = readLattice() as any;
  lattice.solar ??= {};
  lattice.solar.ar4366 = {
    ...lattice.solar.ar4366,
    location: status.ar4366.longitude !== null
      ? `lon ${status.ar4366.longitude}°`
      : 'SOUTHEASTERN_LIMB',
    earth_facing: status.ar4366.earth_facing,
    invisible_fire: status.ar4366.invisible_fire,
    flare_count: status.ar4366.flare_count,
    last_updated: status.timestamp,
  };
  lattice.solar.f107 = status.f107;
  lattice.solar.egs_resonance = status.egs_resonance;
  lattice.solar.earth_facing_disk = status.earth_facing_disk_clear ? 'SPOTLESS' : 'ACTIVE';
  fs.writeFileSync(LATTICE_PATH, JSON.stringify(lattice, null, 2), 'utf-8');
}
