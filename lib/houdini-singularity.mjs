/**
 * Houdini / March 20 — SINGULARITY INTENT KERNEL
 * Single source of truth for gate math & API contracts tests enforce.
 * UI and serverless should converge here (import or mirror); do not drift.
 * NSPFRNP → ∞⁹
 */

export const SINGULARITY_INTENT_ID = 'houdini-singularity-2026-03';

function headerGet(headers, nameLc) {
  const want = nameLc.toLowerCase();
  for (const [k, v] of Object.entries(headers || {})) {
    if (String(k).toLowerCase() === want) return v;
  }
  return undefined;
}

/** H I rest — narrative anchor MHz (ITRF / spectral line standard). */
export const HYDROGEN_REST_MHZ = 1420.405751;

/** Ionosphere / ground storm coupling gate — live planetary Kp (not flare AR latch). */
export const KP_STORM_GATE_MIN = 5;

/** Chunked spectral proxy (acoustic Hz band) — coherence thresholds for “Hydrogen Bridge”. */
export const SPECTRAL_SINGULARITY = {
  CHUNKS: 4,
  CHUNK_SNR_MIN: 2,
  CHUNK_PROF_MIN: 0.5,
  MEDIAN_SNR_MIN: 2.2,
  MEDIAN_PROF_MIN: 0.52,
  MIN_CHUNKS_PASS: 2,
};

/** Cloud compute gate — intent: edge must prove crypto throughput (firmware-class check). */
export const CLOUD_SINGULARITY = {
  SHA256_BENCH_MS_MAX: 20000,
};

// ── T_IONOSPHERE: live Kp storm gate ─────────────────────────────────────────

export function evaluateIonosphereStormGate(kp) {
  const n = kp == null ? NaN : Number(kp);
  if (!Number.isFinite(n)) {
    return { pass: false, tier: 'T_IONOSPHERE', code: 'KP_MISSING', detail: 'Planetary K-index required for storm coupling gate' };
  }
  if (n < KP_STORM_GATE_MIN) {
    return {
      pass: false,
      tier: 'T_IONOSPHERE',
      code: 'KP_BELOW_SINGULARITY_GATE',
      kp: n,
      detail: `Kp ${n} < ${KP_STORM_GATE_MIN} — gate holds until geomagnetic storm-class coupling`,
    };
  }
  return { pass: true, tier: 'T_IONOSPHERE', code: 'GROUND_IONOSPHERE_STORM_ALIGNED', kp: n };
}

// ── T_EQUINOX_NARRATIVE: Mar 20 window must be machine-readable for the show ─

const EQUINOX_REQUIRED_KEYS = ['found', 'kp_max', 'kp_sample_count'];

/**
 * Equinox bundle (?equinox=1) must expose theater window stats for ionosphere narrative,
 * independent of whether live Kp passes the storm gate.
 */
export function evaluateEquinoxNarrativeSingularity(bundle) {
  const violations = [];
  if (!bundle || typeof bundle !== 'object') {
    return { pass: false, tier: 'T_EQUINOX_NARRATIVE', violations: ['bundle_missing'] };
  }
  const ex = bundle.equinox;
  if (!ex || typeof ex !== 'object') {
    violations.push('equinox_object_required');
    return { pass: false, tier: 'T_EQUINOX_NARRATIVE', violations };
  }
  for (const k of EQUINOX_REQUIRED_KEYS) {
    if (!(k in ex)) violations.push(`equinox_missing_${k}`);
  }
  if (typeof ex.found !== 'boolean') violations.push('equinox_found_must_be_boolean');
  if (ex.kp_max != null && !Number.isFinite(Number(ex.kp_max))) violations.push('equinox_kp_max_must_be_numeric_or_null');
  if (typeof ex.kp_sample_count !== 'number' || !Number.isFinite(ex.kp_sample_count)) {
    violations.push('equinox_kp_sample_count_must_be_finite_number');
  }
  return {
    pass: violations.length === 0,
    tier: 'T_EQUINOX_NARRATIVE',
    violations,
    snapshot: ex.snapshot_used === true,
  };
}

// ── T_CATALOG_ANCHOR: JPL SBDB block when present must anchor 3I/ATLAS narrative ─

const ATLAS_REQUIRED_WHEN_PRESENT = ['fullname'];

export function evaluateAtlasCatalogSingularity(atlas) {
  if (atlas == null) {
    return { pass: true, tier: 'T_CATALOG_ANCHOR', code: 'ATLAS_ABSENT', note: 'JPL step may have failed — not a hard fail for T1' };
  }
  if (typeof atlas !== 'object') {
    return { pass: false, tier: 'T_CATALOG_ANCHOR', violations: ['atlas_must_be_object'] };
  }
  const violations = [];
  for (const k of ATLAS_REQUIRED_WHEN_PRESENT) {
    if (atlas[k] == null || atlas[k] === '') violations.push(`atlas_missing_${k}`);
  }
  return {
    pass: violations.length === 0,
    tier: 'T_CATALOG_ANCHOR',
    violations,
    code: violations.length === 0 ? 'COMET_NARRATIVE_ANCHORED' : undefined,
  };
}

// ── T_EDGE_HYDROGEN: Blank Stone packet + headers ────────────────────────────

export function evaluateBlankStoneSingularity(body, headers = {}) {
  const violations = [];
  if (!body || typeof body !== 'object') {
    return { pass: false, tier: 'T_EDGE_HYDROGEN', violations: ['body_required'] };
  }
  if (body.blank_stone !== true) violations.push('blank_stone_must_be_true');
  if (body.legacy_operating_system !== false) violations.push('legacy_operating_system_must_be_false');
  const mhz = Number(body.hydrogen_line_mhz);
  if (!Number.isFinite(mhz) || Math.abs(mhz - HYDROGEN_REST_MHZ) > 0.05) {
    violations.push('hydrogen_line_mhz_must_match_rest_within_tolerance');
  }
  if (typeof body.packet_hex !== 'string' || body.packet_hex.length < 32) {
    violations.push('packet_hex_must_be_sha256_like');
  }
  const hMhz = headerGet(headers, 'x-hydrogen-line-mhz');
  if (hMhz != null && hMhz !== '') {
    const hm = Number(hMhz);
    if (Number.isFinite(hm) && Math.abs(hm - HYDROGEN_REST_MHZ) > 0.05) {
      violations.push('header_x_hydrogen_line_mhz_mismatch');
    }
  }
  return { pass: violations.length === 0, tier: 'T_EDGE_HYDROGEN', violations };
}

// ── T_BRIDGE_PROXY: local spectral coherence (Hz proxy, not sky MHz) ────────

export function evaluateHydrogenBridgeProxySingularity(metrics) {
  const { medianSnr, medianProf, passChunks } = metrics;
  const S = SPECTRAL_SINGULARITY;
  const chunksOk =
    typeof passChunks === 'number' &&
    (passChunks >= S.MIN_CHUNKS_PASS ||
      (Number(medianSnr) >= S.MEDIAN_SNR_MIN && Number(medianProf) >= S.MEDIAN_PROF_MIN));
  if (!chunksOk) {
    return {
      pass: false,
      tier: 'T_BRIDGE_PROXY',
      code: 'NO_COHERENCE',
      detail: 'Chunked median / pass-count below singularity thresholds',
    };
  }
  return { pass: true, tier: 'T_BRIDGE_PROXY', code: 'HYDROGEN_BRIDGE_COHERENT_PROXY' };
}

// ── T_CLOUD_EDGE: deployed compute probe ───────────────────────────────────

export function evaluateCloudComputeSingularity(probe) {
  const violations = [];
  if (!probe || typeof probe !== 'object') {
    return { pass: false, tier: 'T_CLOUD_EDGE', violations: ['probe_required'] };
  }
  if (probe.ok !== true) violations.push('probe_ok_must_be_true');
  const ms = probe.firmware_sha256_throughput_ms;
  if (ms == null || ms >= CLOUD_SINGULARITY.SHA256_BENCH_MS_MAX) {
    violations.push('firmware_sha256_throughput_ms_must_be_under_cap');
  }
  const hook = probe.remote_gpu_hook;
  if (hook && hook.attempted && hook.ok !== true && !(hook.json && hook.json.ok === true)) {
    violations.push('remote_gpu_hook_failed_when_configured');
  }
  return { pass: violations.length === 0, tier: 'T_CLOUD_EDGE', violations };
}

// ── T_LATTICE_LIVE: /lattice-status.json vs manifest (3I/ATLAS node + H line) — LIVE each run ─

/**
 * Confirms deployed lattice library matches sing9-firmware-verify.json expectations.
 * Run on every Verify — static files do not satisfy this gate.
 */
export function evaluateLiveFirmwareLatticeSingularity(lattice, manifest) {
  const violations = [];
  if (!manifest || typeof manifest !== 'object') {
    return { pass: false, tier: 'T_LATTICE_LIVE', violations: ['manifest_missing'] };
  }
  const exp = manifest.expected || {};
  if (!lattice || typeof lattice !== 'object') {
    return { pass: false, tier: 'T_LATTICE_LIVE', violations: ['lattice_status_missing'] };
  }
  if (lattice.ok !== true) violations.push('lattice_ok_must_be_true');
  if (exp.lattice_spec_version != null && lattice.spec_version !== exp.lattice_spec_version) {
    violations.push('lattice_spec_version_mismatch');
  }
  const sync = lattice.lattice_sync;
  if (!sync || typeof sync !== 'object') violations.push('lattice_sync_required');
  else {
    const sig = sync.signature;
    const minLen = Number(exp.min_lattice_signature_length) || 8;
    if (typeof sig !== 'string' || sig.length < minLen) violations.push('lattice_signature_too_short');
    const fm = Number(sync.frequency_mhz);
    if (!Number.isFinite(fm) || Math.abs(fm - HYDROGEN_REST_MHZ) > 0.05) {
      violations.push('lattice_sync_frequency_mhz_mismatch');
    }
  }
  const constants = lattice.constants;
  if (!constants || typeof constants !== 'object') violations.push('lattice_constants_required');
  else {
    const ch = Number(constants.hydrogen_line_mhz);
    if (!Number.isFinite(ch) || Math.abs(ch - HYDROGEN_REST_MHZ) > 0.05) {
      violations.push('constants_hydrogen_line_mhz_mismatch');
    }
  }
  if (exp.lattice_hydrogen_line_mhz != null) {
    const want = Number(exp.lattice_hydrogen_line_mhz);
    const ch = Number(lattice.constants && lattice.constants.hydrogen_line_mhz);
    if (!Number.isFinite(ch) || Math.abs(ch - want) > 0.05) violations.push('manifest_expected_mhz_mismatch');
  }
  if (exp.lattice_sync_frequency_must_match_constants === true && sync && lattice.constants) {
    const a = Number(sync.frequency_mhz);
    const b = Number(lattice.constants.hydrogen_line_mhz);
    if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) > 0.001) {
      violations.push('sync_frequency_must_match_constants');
    }
  }
  return { pass: violations.length === 0, tier: 'T_LATTICE_LIVE', violations };
}

/**
 * LIVE edge channel = Blank Stone API + lattice firmware library check (both each button press).
 */
export function evaluateEdgeHydrogenChannel(blankStoneEval, latticeLiveEval) {
  const violations = [];
  if (!blankStoneEval || blankStoneEval.pass !== true) {
    violations.push('blank_stone:' + (blankStoneEval && blankStoneEval.violations ? blankStoneEval.violations.join(',') : 'fail'));
  }
  if (!latticeLiveEval || latticeLiveEval.pass !== true) {
    violations.push('lattice_live:' + (latticeLiveEval && latticeLiveEval.violations ? latticeLiveEval.violations.join(',') : 'fail'));
  }
  return {
    pass: blankStoneEval?.pass === true && latticeLiveEval?.pass === true,
    tier: 'T_EDGE_LIVE',
    violations,
    parts: { blankStone: blankStoneEval, latticeLive: latticeLiveEval },
  };
}

// ── T180_LOCKED: composed ritual success (product singularity) ───────────────

/**
 * All four channel gates must pass for “180 Locked” — does not imply T4 RF comet proof.
 * `blankStone` slot should be evaluateEdgeHydrogenChannel(...) output (Blank Stone + lattice LIVE).
 */
export function composeT180LockedSingularity({ ionosphere, cloud, bridgeProxy, blankStone }) {
  const gates = { ionosphere, cloud, bridgeProxy, blankStone };
  const pass =
    ionosphere?.pass === true &&
    cloud?.pass === true &&
    bridgeProxy?.pass === true &&
    blankStone?.pass === true;
  return {
    pass,
    tier: 'T180_PRODUCT',
    gates,
    manifest: pass ? 'SINGULARITY_180_LOCKED' : 'SINGULARITY_INCOMPLETE',
  };
}

// ── T4 placeholder — explicit non-claim until observatory pipeline exists ────

export function evaluateRfCometHydrogenSingularity() {
  return {
    pass: false,
    tier: 'T4_RF_COMET',
    code: 'NOT_IMPLEMENTED',
    detail: 'Intent reserved: L-band observatory pipeline + pre-registered detection criterion',
  };
}

// ── Latest bundle minimal contract (live-houdini-readings default mode) ─────

export function evaluateLiveReadingsLatestSingularity(bundle) {
  const violations = [];
  if (!bundle || typeof bundle !== 'object') {
    return { pass: false, tier: 'T_API_LATEST', violations: ['bundle_required'] };
  }
  if (bundle.mode !== 'latest') violations.push('mode_should_be_latest');
  if (!bundle.kp || typeof bundle.kp !== 'object') violations.push('kp_object_required');
  else {
    const k = bundle.kp.kp;
    if (k != null && !Number.isFinite(Number(k))) violations.push('kp_value_must_be_numeric_or_null');
  }
  return { pass: violations.length === 0, tier: 'T_API_LATEST', violations };
}
