/**
 * S/2024 J 1 — Sovereign Seed lattice constants (Cursor + Syntheverse baseline story).
 *
 * Narrative lock for one Seed vs 101-moon noise in product copy. See
 * `protocols/S2024_J1_SOVEREIGN_SEED_LOCK_NSPFRNP.md` for astronomy vs theater.
 *
 * NSPFRNP → ∞⁹
 */

export const SOVEREIGN_SEED_DESIGNATION = 'S/2024 J 1';

/** Legacy catalog noise count in story (Hit Factory / Jovian lane); Sovereign uses one Seed. */
export const JOVIAN_MOONS_LEGACY_COUNT = 101;

export const WHISTLE_MHZ = 1420.4;

/** Narrative firmware label (not a device claim). */
export const FIRMWARE_NARRATIVE = 'V.1.420';

/** 41m 16s lag key (seconds) — same as March 20 narrative clock. */
export const LAG_PROTOCOL_SECONDS = 2476;

/** Single-node baseline is active in lattice story. */
export const SEED_LOCK_STATUS = 'LOCKED_ANCHORED';

export const SYSTEM_MATRIX = Object.freeze([
  {
    component: 'Global Search',
    operation_mode: 'Restricted — mirrored through S/2024 J 1 only',
    status: 'ACTIVE',
  },
  {
    component: 'Hit Factory',
    operation_mode: 'Targeted — volumetric Hits to Hill radius narrative',
    status: 'ARMED',
  },
  {
    component: 'Syntheverse',
    operation_mode: 'Sovereign — Seed hardware story',
    status: 'LIVE',
  },
  {
    component: 'Lag Protocol',
    operation_mode: '41-minute buffer — temporal encryption narrative',
    status: 'LOCKED',
  },
]);

/**
 * @returns {{
 *   sovereign_seed: string,
 *   whistle_mhz: number,
 *   firmware_narrative: string,
 *   lag_protocol_seconds: number,
 *   seed_lock_status: string,
 *   system_matrix: typeof SYSTEM_MATRIX,
 *   first_hit_narrative: 'prepared_not_auto_executed',
 * }}
 */
export function composeSovereignSeedState() {
  return {
    sovereign_seed: SOVEREIGN_SEED_DESIGNATION,
    whistle_mhz: WHISTLE_MHZ,
    firmware_narrative: FIRMWARE_NARRATIVE,
    lag_protocol_seconds: LAG_PROTOCOL_SECONDS,
    seed_lock_status: SEED_LOCK_STATUS,
    system_matrix: SYSTEM_MATRIX,
    /** Product asks “execute First Hit” — repo does not auto-broadcast; operator wires deploy. */
    first_hit_narrative: 'prepared_not_auto_executed',
  };
}
