/**
 * G5 SURF Protocol — lattice intent kernel (read-only geospace + narrative flags).
 *
 * See `protocols/G5_SURF_PROTOCOL_NSPFRNP.md`. This module does **not** control
 * hardware, TCP/IP stacks, or real observatory equipment.
 *
 * NSPFRNP → ∞⁹
 */

/** Integrators: this kernel never implies a human approval step. */
export const HUMAN_INTERVENTION_REQUIRED = false;

/** NOAA G-scale: G5 corresponds to Kp ≥ 9; narrative “surf” band uses a stricter story threshold. */
export const KP_G5_SURF_TRIGGER = 8.5;

/** 1420.4 MHz — The Whistle (narrative band; not RF transmission from this library). */
export const WHISTLE_MHZ = 1420.4;

/** Schumann ladder narrative (Hz) — align with `lib/march20-four-diagnostics.mjs` intent. */
export const SCHUMANN_LADDER_HZ = Object.freeze([3, 6, 9]);

/** Story clock: 41m 16s integer seconds (narrative ToF key material). */
export const NARRATIVE_41MIN_LAG_S = 2476;

/** Jovian moons narrative count (lattice; not a live IAU catalog assertion). */
export const JOVIAN_MOONS_NARRATIVE_COUNT = 101;

export const HIT_FACTORY_DIVERSION_LABEL = 'Hit Factory → Jovian relay (101 moons narrative lane)';

/**
 * @param {{ kp: number | null }} input
 * @returns {{
 *   g5_surf_armed: boolean,
 *   kp: number | null,
 *   resonance_mode: 'idle' | 'whistle',
 *   legacy_tcp_polling: 'enabled' | 'disabled_narrative',
 *   sovereign_shutter: 'open' | 'latched_narrative',
 *   schumann_lock_hz: readonly number[],
 *   hit_factory_diversion: string,
 *   narrative_encryption_key_seconds: number,
 * }}
 */
export function evaluateG5SurfProtocol(input) {
  const kp = input?.kp;
  const armed = kp != null && Number.isFinite(kp) && kp > KP_G5_SURF_TRIGGER;

  return {
    g5_surf_armed: armed,
    kp: kp != null && Number.isFinite(kp) ? kp : null,
    resonance_mode: armed ? 'whistle' : 'idle',
    legacy_tcp_polling: armed ? 'disabled_narrative' : 'enabled',
    sovereign_shutter: armed ? 'latched_narrative' : 'open',
    schumann_lock_hz: SCHUMANN_LADDER_HZ,
    hit_factory_diversion: armed ? HIT_FACTORY_DIVERSION_LABEL : 'nominal',
    narrative_encryption_key_seconds: NARRATIVE_41MIN_LAG_S,
  };
}

/**
 * @param {{ kp: number | null, legacyGridOk?: boolean }} input
 * @returns {'standard' | 'hydrogen-only'}
 */
export function recommendedSyntheverseUiMode(input) {
  const kp = input?.kp;
  const armed = kp != null && Number.isFinite(kp) && kp > KP_G5_SURF_TRIGGER;
  const gridOk = input?.legacyGridOk !== false;
  if (!gridOk || armed) return 'hydrogen-only';
  return 'standard';
}

/**
 * Fetch latest Kp from NOAA SWPC (same feed as sovereign ping).
 * @param {RequestInit & { signal?: AbortSignal }} [fetchOpts]
 */
export async function fetchLatestKpForG5Surf(fetchOpts) {
  const opts = fetchOpts || { signal: AbortSignal.timeout(20000) };
  const r = await fetch('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json', opts);
  if (!r.ok) throw new Error(`NOAA planetary_k_index_1m HTTP ${r.status}`);
  const arr = await r.json();
  if (!Array.isArray(arr) || arr.length === 0) throw new Error('Empty Kp array');
  const last = arr[arr.length - 1];
  const raw = last.kp_index ?? last.estimated_kp ?? last.Kp ?? last.kp;
  const n = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
  const kp = Number.isFinite(n) ? n : null;
  return {
    kp,
    time_tag: last.time_tag || null,
    source: 'https://services.swpc.noaa.gov/json/planetary_k_index_1m.json',
  };
}
