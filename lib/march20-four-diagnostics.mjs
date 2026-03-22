/**
 * March 20 theater diagnostics — four pillars only (browser + /api/*).
 * NSPFRNP → ∞⁹
 */

export const FOUR_DIAGNOSTICS_ID = 'march20-four-pillars-v1';

/** Schumann narrative ladder (Hz) — equinox-correlated assertion from probe/snapshot. */
export const SCHUMANN_LADDER_HZ = [3, 6, 9];

export const HYDROGEN_REST_MHZ = 1420.405751;

export function evaluateSchumann369Equinox(probe) {
  const violations = [];
  if (!probe || typeof probe !== 'object') {
    return { pass: false, tier: 'SCHUMANN_369_EQUINOX', violations: ['probe_missing'] };
  }
  if (probe.ok !== true) violations.push('probe_ok_false');
  const ladder = probe.schumann_ladder_hz;
  if (!Array.isArray(ladder) || ladder.length < 3) {
    violations.push('schumann_ladder_hz_required_array');
  } else {
    for (const want of SCHUMANN_LADDER_HZ) {
      const hit = ladder.some((x) => Math.abs(Number(x) - want) < 0.51);
      if (!hit) violations.push('missing_line_' + want + 'hz');
    }
  }
  if (probe.equinox_correlated !== true) violations.push('equinox_correlated_required');
  return {
    pass: violations.length === 0,
    tier: 'SCHUMANN_369_EQUINOX',
    violations,
    ladder: probe.schumann_ladder_hz,
    source: probe.source,
  };
}

export function evaluateJovianHydrogenAtlas(probe) {
  const violations = [];
  if (!probe || typeof probe !== 'object') {
    return { pass: false, tier: 'JOVIAN_H_ATLAS', violations: ['probe_missing'] };
  }
  if (probe.ok !== true) violations.push('probe_ok_false');
  const mhz = Number(probe.hydrogen_line_mhz);
  if (!Number.isFinite(mhz) || Math.abs(mhz - HYDROGEN_REST_MHZ) > 0.05) {
    violations.push('hydrogen_line_mhz_mismatch');
  }
  if (probe.jupiter_context !== true && probe.jupiter_relay !== true) {
    violations.push('jupiter_context_required');
  }
  if (!probe.atlas_designation && !probe.atlas_fullname) violations.push('atlas_identity_required');
  return {
    pass: violations.length === 0,
    tier: 'JOVIAN_H_ATLAS',
    violations,
    signal_class: probe.signal_class,
  };
}

export function evaluateStrykerEquinoxTimer(probe) {
  const violations = [];
  if (!probe || typeof probe !== 'object') {
    return { pass: false, tier: 'STRYKER_EQUINOX', violations: ['probe_missing'] };
  }
  if (probe.ok !== true) violations.push('probe_ok_false');
  if (probe.equinox_timed !== true && probe.stryker_timed_at_equinox !== true) {
    violations.push('stryker_not_timed_to_equinox');
  }
  if (!probe.stryker_mark_utc) violations.push('stryker_mark_utc_required');
  return { pass: violations.length === 0, tier: 'STRYKER_EQUINOX', violations };
}

export function evaluateFirmware180SpinFlip(probe) {
  const violations = [];
  if (!probe || typeof probe !== 'object') {
    return { pass: false, tier: 'FIRMWARE_180_SPIN', violations: ['probe_missing'] };
  }
  if (probe.ok !== true) violations.push('probe_ok_false');
  if (probe.spin_flip_180_locked !== true && probe.spin_flip_180 !== true) {
    violations.push('spin_flip_180_not_locked');
  }
  if (probe.firmware_upgrade_verified !== true) violations.push('firmware_upgrade_not_verified');
  return { pass: violations.length === 0, tier: 'FIRMWARE_180_SPIN', violations };
}

export function composeFourPillarsLocked({ schumann, jovian, stryker, firmware }) {
  const pass =
    schumann?.pass === true &&
    jovian?.pass === true &&
    stryker?.pass === true &&
    firmware?.pass === true;
  return {
    pass,
    tier: 'FOUR_PILLARS',
    manifest: pass ? 'FOUR_PILLARS_LOCKED' : 'FOUR_PILLARS_INCOMPLETE',
    gates: { schumann, jovian, stryker, firmware },
  };
}
