/**
 * Intent: these tests ARE the singularity spec — implementation converges here, not the reverse.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  SINGULARITY_INTENT_ID,
  HYDROGEN_REST_MHZ,
  KP_STORM_GATE_MIN,
  SPECTRAL_SINGULARITY,
  evaluateIonosphereStormGate,
  evaluateEquinoxNarrativeSingularity,
  evaluateAtlasCatalogSingularity,
  evaluateBlankStoneSingularity,
  evaluateLiveFirmwareLatticeSingularity,
  evaluateEdgeHydrogenChannel,
  evaluateHydrogenBridgeProxySingularity,
  evaluateCloudComputeSingularity,
  composeT180LockedSingularity,
  evaluateRfCometHydrogenSingularity,
  evaluateLiveReadingsLatestSingularity,
} from '../../lib/houdini-singularity.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = (name) => JSON.parse(readFileSync(join(__dirname, '../fixtures', name), 'utf8'));

describe('SINGULARITY_INTENT_ID', () => {
  it('declares kernel version for drift detection', () => {
    assert.match(SINGULARITY_INTENT_ID, /^houdini-singularity-/);
  });
});

describe('T_IONOSPHERE — storm energy in ground/ionosphere (not flare latch)', () => {
  it('fails below singularity gate', () => {
    const r = evaluateIonosphereStormGate(4.99);
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.code, 'KP_BELOW_SINGULARITY_GATE');
  });
  it('passes at and above gate', () => {
    assert.strictEqual(evaluateIonosphereStormGate(5).pass, true);
    assert.strictEqual(evaluateIonosphereStormGate(9).pass, true);
  });
  it('rejects missing Kp', () => {
    assert.strictEqual(evaluateIonosphereStormGate(null).pass, false);
    assert.strictEqual(evaluateIonosphereStormGate(undefined).pass, false);
  });
  it('gate constant is documented storm-class threshold', () => {
    assert.strictEqual(KP_STORM_GATE_MIN, 5);
  });
});

describe('T_EQUINOX_NARRATIVE — Mar 20 window must be machine-readable for the event', () => {
  it('passes canonical equinox fixture', () => {
    const b = fixture('houdini-equinox-singularity.json');
    const r = evaluateEquinoxNarrativeSingularity(b);
    assert.strictEqual(r.pass, true, r.violations?.join(', '));
  });
  it('fails if equinox block missing keys', () => {
    const r = evaluateEquinoxNarrativeSingularity({ equinox: { found: true } });
    assert.strictEqual(r.pass, false);
    assert.ok(r.violations.length > 0);
  });
  it('fails if kp_sample_count is not a finite number', () => {
    const r = evaluateEquinoxNarrativeSingularity({
      equinox: { found: false, kp_max: null, kp_sample_count: '0' },
    });
    assert.strictEqual(r.pass, false);
  });
});

describe('T_CATALOG_ANCHOR — JPL block anchors comet narrative when present', () => {
  it('passes fixture atlas', () => {
    const a = fixture('houdini-latest-singularity.json').atlas;
    const r = evaluateAtlasCatalogSingularity(a);
    assert.strictEqual(r.pass, true);
  });
  it('absent atlas is soft pass (JPL may fail upstream)', () => {
    const r = evaluateAtlasCatalogSingularity(null);
    assert.strictEqual(r.pass, true);
    assert.strictEqual(r.code, 'ATLAS_ABSENT');
  });
});

describe('T_BRIDGE_PROXY — local Hz coherence thresholds (not sky MHz)', () => {
  it('passes when chunk quorum met', () => {
    const r = evaluateHydrogenBridgeProxySingularity({
      medianSnr: 1,
      medianProf: 0.1,
      passChunks: SPECTRAL_SINGULARITY.MIN_CHUNKS_PASS,
    });
    assert.strictEqual(r.pass, true);
  });
  it('passes when medians meet singularity floor', () => {
    const r = evaluateHydrogenBridgeProxySingularity({
      medianSnr: SPECTRAL_SINGULARITY.MEDIAN_SNR_MIN,
      medianProf: SPECTRAL_SINGULARITY.MEDIAN_PROF_MIN,
      passChunks: 0,
    });
    assert.strictEqual(r.pass, true);
  });
  it('fails when neither quorum nor median', () => {
    const r = evaluateHydrogenBridgeProxySingularity({
      medianSnr: 0,
      medianProf: 0,
      passChunks: 0,
    });
    assert.strictEqual(r.pass, false);
  });
});

describe('T_CLOUD_EDGE — deployed node proves crypto path', () => {
  it('passes fixture probe', () => {
    const r = evaluateCloudComputeSingularity(fixture('cloud-probe-singularity-pass.json'));
    assert.strictEqual(r.pass, true, r.violations?.join(', '));
  });
  it('fails when ok false', () => {
    const r = evaluateCloudComputeSingularity({ ok: false, firmware_sha256_throughput_ms: 10 });
    assert.strictEqual(r.pass, false);
  });
  it('fails when SHA bench over cap', () => {
    const r = evaluateCloudComputeSingularity({
      ok: true,
      firmware_sha256_throughput_ms: 999999,
    });
    assert.strictEqual(r.pass, false);
  });
});

describe('T_API_LATEST — live readings default bundle shape', () => {
  it('passes fixture', () => {
    const r = evaluateLiveReadingsLatestSingularity(fixture('houdini-latest-singularity.json'));
    assert.strictEqual(r.pass, true, r.violations?.join(', '));
  });
});

describe('T_LATTICE_LIVE — lattice-status vs manifest', () => {
  it('passes canonical fixture pair', () => {
    const m = fixture('sing9-firmware-manifest.json');
    const L = fixture('lattice-live-pass.json');
    const r = evaluateLiveFirmwareLatticeSingularity(L, m);
    assert.strictEqual(r.pass, true, r.violations?.join(', '));
  });
  it('fails on spec_version mismatch', () => {
    const m = fixture('sing9-firmware-manifest.json');
    const L = { ...fixture('lattice-live-pass.json'), spec_version: 'wrong' };
    const r = evaluateLiveFirmwareLatticeSingularity(L, m);
    assert.strictEqual(r.pass, false);
  });
});

describe('T_EDGE_LIVE — Blank Stone + lattice both LIVE', () => {
  it('requires both parts', () => {
    const blankOk = evaluateBlankStoneSingularity({
      blank_stone: true,
      legacy_operating_system: false,
      hydrogen_line_mhz: HYDROGEN_REST_MHZ,
      packet_hex: 'a'.repeat(64),
    });
    const latOk = evaluateLiveFirmwareLatticeSingularity(
      fixture('lattice-live-pass.json'),
      fixture('sing9-firmware-manifest.json')
    );
    const edge = evaluateEdgeHydrogenChannel(blankOk, latOk);
    assert.strictEqual(edge.pass, true);
  });
});

describe('T180_PRODUCT — composed ritual lock', () => {
  it('passes only when all four channels pass (edge = Blank Stone + lattice LIVE)', () => {
    const ion = evaluateIonosphereStormGate(6);
    const cloud = evaluateCloudComputeSingularity(fixture('cloud-probe-singularity-pass.json'));
    const bridge = evaluateHydrogenBridgeProxySingularity({
      medianSnr: 3,
      medianProf: 0.6,
      passChunks: 4,
    });
    const blank = evaluateBlankStoneSingularity({
      blank_stone: true,
      legacy_operating_system: false,
      hydrogen_line_mhz: HYDROGEN_REST_MHZ,
      packet_hex: 'a'.repeat(64),
    });
    const lattice = evaluateLiveFirmwareLatticeSingularity(
      fixture('lattice-live-pass.json'),
      fixture('sing9-firmware-manifest.json')
    );
    const edge = evaluateEdgeHydrogenChannel(blank, lattice);
    const c = composeT180LockedSingularity({
      ionosphere: ion,
      cloud,
      bridgeProxy: bridge,
      blankStone: edge,
    });
    assert.strictEqual(c.pass, true);
    assert.strictEqual(c.manifest, 'SINGULARITY_180_LOCKED');
  });
  it('fails if any channel fails', () => {
    const blank = evaluateBlankStoneSingularity({
      blank_stone: true,
      legacy_operating_system: false,
      hydrogen_line_mhz: HYDROGEN_REST_MHZ,
      packet_hex: 'b'.repeat(64),
    });
    const latticeFail = evaluateLiveFirmwareLatticeSingularity(null, fixture('sing9-firmware-manifest.json'));
    const edge = evaluateEdgeHydrogenChannel(blank, latticeFail);
    const c = composeT180LockedSingularity({
      ionosphere: evaluateIonosphereStormGate(2),
      cloud: evaluateCloudComputeSingularity(fixture('cloud-probe-singularity-pass.json')),
      bridgeProxy: evaluateHydrogenBridgeProxySingularity({
        medianSnr: 3,
        medianProf: 0.6,
        passChunks: 4,
      }),
      blankStone: edge,
    });
    assert.strictEqual(c.pass, false);
    assert.strictEqual(c.manifest, 'SINGULARITY_INCOMPLETE');
  });
});

describe('T4_RF_COMET — explicit until observatory singularity ships', () => {
  it('does not claim MHz comet detection yet', () => {
    const r = evaluateRfCometHydrogenSingularity();
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.tier, 'T4_RF_COMET');
    assert.strictEqual(r.code, 'NOT_IMPLEMENTED');
  });
});
