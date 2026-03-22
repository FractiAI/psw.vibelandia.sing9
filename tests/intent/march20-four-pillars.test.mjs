/**
 * March 20 magic trick — four pillars intent (Schumann, Jovian H, Stryker, firmware 180°).
 * NSPFRNP → ∞⁹
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateSchumann369Equinox,
  evaluateJovianHydrogenAtlas,
  evaluateStrykerEquinoxTimer,
  evaluateFirmware180SpinFlip,
  composeFourPillarsLocked,
  SCHUMANN_LADDER_HZ,
  HYDROGEN_REST_MHZ,
} from '../../lib/march20-four-diagnostics.mjs';

describe('march20-four-diagnostics', () => {
  it('SCHUMANN_LADDER_HZ is 3 6 9', () => {
    assert.deepEqual(SCHUMANN_LADDER_HZ, [3, 6, 9]);
  });

  it('evaluateSchumann369Equinox passes on golden probe', () => {
    const ev = evaluateSchumann369Equinox({
      ok: true,
      schumann_ladder_hz: [3, 6, 9],
      equinox_correlated: true,
      source: 'fixture',
    });
    assert.equal(ev.pass, true);
    assert.equal(ev.tier, 'SCHUMANN_369_EQUINOX');
  });

  it('evaluateSchumann369Equinox fails when ladder missing 6 Hz', () => {
    const ev = evaluateSchumann369Equinox({
      ok: true,
      schumann_ladder_hz: [3, 5, 9],
      equinox_correlated: true,
    });
    assert.equal(ev.pass, false);
    assert.ok((ev.violations || []).includes('missing_line_6hz'));
  });

  it('evaluateJovianHydrogenAtlas passes on golden probe', () => {
    const ev = evaluateJovianHydrogenAtlas({
      ok: true,
      hydrogen_line_mhz: HYDROGEN_REST_MHZ,
      jupiter_context: true,
      atlas_fullname: 'C/2025 N1 (ATLAS)',
      atlas_designation: 'C/2025 N1',
      signal_class: 'fixture',
    });
    assert.equal(ev.pass, true);
  });

  it('evaluateStrykerEquinoxTimer passes on golden probe', () => {
    const ev = evaluateStrykerEquinoxTimer({
      ok: true,
      equinox_timed: true,
      stryker_mark_utc: '2026-03-20T09:46:23.000Z',
    });
    assert.equal(ev.pass, true);
  });

  it('evaluateFirmware180SpinFlip passes when spin and upgrade latched', () => {
    const ev = evaluateFirmware180SpinFlip({
      ok: true,
      spin_flip_180_locked: true,
      firmware_upgrade_verified: true,
    });
    assert.equal(ev.pass, true);
  });

  it('composeFourPillarsLocked requires all four evaluators pass', () => {
    const baseS = { pass: true, tier: 'SCHUMANN_369_EQUINOX', violations: [] };
    const baseJ = { pass: true, tier: 'JOVIAN_H_ATLAS', violations: [] };
    const baseSt = { pass: true, tier: 'STRYKER_EQUINOX', violations: [] };
    const baseF = { pass: true, tier: 'FIRMWARE_180_SPIN', violations: [] };

    const all = composeFourPillarsLocked({
      schumann: baseS,
      jovian: baseJ,
      stryker: baseSt,
      firmware: baseF,
    });
    assert.equal(all.pass, true);
    assert.equal(all.manifest, 'FOUR_PILLARS_LOCKED');

    const oneFail = composeFourPillarsLocked({
      schumann: { ...baseS, pass: false },
      jovian: baseJ,
      stryker: baseSt,
      firmware: baseF,
    });
    assert.equal(oneFail.pass, false);
    assert.equal(oneFail.manifest, 'FOUR_PILLARS_INCOMPLETE');
  });
});
