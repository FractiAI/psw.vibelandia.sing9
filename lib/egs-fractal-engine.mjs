/**
 * EGS Fractal Engine — El Gran Sol φ (1.618) scaling for NAV + generative seeds.
 * Shared by FractiAI/digital-pru /api/egs-emulation and browser bundles (no ML; deterministic “latent” hints).
 * NSPFRNP → ∞⁹
 */

/** El Gran Sol fractal constant (golden ratio) — core scaling for transitions. */
export const EGS_FRACTAL = 1.618033988749895;
export const UNITARY_HYDROGEN_DYAD = Object.freeze({
  proton: 1,
  electron: 1,
});
export const UMBILICAL_CHANNEL_COUNT = 13;

/** @typedef {'external' | 'internal'} AttentionMode */

/**
 * @typedef {Object} NeuralAttentionVector
 * @property {number} x
 * @property {number} y
 * @property {number} z
 * @property {string} conceptId
 * @property {AttentionMode} mode
 */

/**
 * @param {string} s
 * @returns {number} in [0, 1)
 */
export function hashStringToUnit(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1_000_001) / 1_000_001;
}

/**
 * Generative seed from NAV + optional prior — φ-weighted mixing.
 * @param {{ x: number, y: number, z: number }} nav
 * @param {number} [priorSeed]
 * @returns {number} 32-bit positive integer
 */
export function computeGenerativeSeed(nav, priorSeed = 0) {
  const phi = EGS_FRACTAL;
  const x = nav.x * phi;
  const y = nav.y * phi * phi;
  const z = nav.z * phi * phi * phi;
  const base = (x + y + z) % 1;
  const prior = (priorSeed >>> 0) / 0xffffffff;
  const mix = (base + prior / phi) % 1;
  return Math.max(1, (mix * 0x7fffffff) | 0);
}

/**
 * @param {{ x: number, y: number, z: number }} nav
 * @returns {'external' | 'internal'}
 */
export function resolveAttentionMode(nav) {
  const t = (nav.x + nav.y + nav.z) / 3;
  const z = nav.z;
  const internal = z > t / EGS_FRACTAL + 0.12;
  return internal ? 'internal' : 'external';
}

/**
 * Ease with φ curvature (smooth transition trigger).
 * @param {number} t
 */
export function egsEase(t) {
  const u = Math.min(1, Math.max(0, t));
  return 1 - (1 - u) ** EGS_FRACTAL;
}

/**
 * @param {{ x: number, y: number, z: number }} a
 * @param {{ x: number, y: number, z: number }} b
 * @param {number} t
 */
export function lerpNavComponents(a, b, t) {
  const w = egsEase(t);
  return {
    x: a.x + (b.x - a.x) * w,
    y: a.y + (b.y - a.y) * w,
    z: a.z + (b.z - a.z) * w,
  };
}

/**
 * Target NAV for a concept label — deterministic “latent” direction (no model).
 * @param {string} conceptId
 */
export function conceptToTargetNav(conceptId) {
  const h = hashStringToUnit(conceptId);
  const h2 = hashStringToUnit(conceptId + '|φ');
  const h3 = hashStringToUnit(conceptId + '|edge');
  return {
    x: h,
    y: (h + 1 / EGS_FRACTAL) % 1,
    z: h2 * (0.35 + h3 * 0.65),
  };
}

/**
 * @param {string} conceptId
 * @param {{ x: number, y: number, z: number }} [current]
 */
export function emulateEgsPayload(conceptId, current) {
  const target = conceptToTargetNav(conceptId);
  const base = current || { x: 0.5, y: 0.5, z: 0.25 };
  const nav = lerpNavComponents(base, target, 1);
  const mode = resolveAttentionMode(nav);
  const seed = computeGenerativeSeed(nav, 0);
  const coherence = Number((((nav.x + nav.y + nav.z) / 3) * EGS_FRACTAL).toFixed(6));
  const equilibriumDelta = Number((0.5 - Math.abs(nav.z - 0.5)).toFixed(6));
  const channelFootprint = `FOOTPRINT_A_${String(1).padStart(3, '0')}`;
  const channelMap = [
    { channel_id: 1, protocol_type: 'radiometric_low', frequency_mapping: '10.65 GHz' },
    { channel_id: 2, protocol_type: 'radiometric_low', frequency_mapping: '18.70 GHz' },
    { channel_id: 3, protocol_type: 'radiometric_low', frequency_mapping: '23.80 GHz' },
    { channel_id: 4, protocol_type: 'radiometric_mid', frequency_mapping: '36.50 GHz' },
    { channel_id: 5, protocol_type: 'radiometric_mid', frequency_mapping: '89.00 GHz' },
    { channel_id: 6, protocol_type: 'radiometric_mid', frequency_mapping: '166.00 GHz' },
    { channel_id: 7, protocol_type: 'radiometric_high', frequency_mapping: '183.31 GHz' },
    { channel_id: 8, protocol_type: 'radiometric_high', frequency_mapping: 'WLAN Ch 1 (2.412 GHz)' },
    { channel_id: 9, protocol_type: 'radiometric_high', frequency_mapping: 'WLAN Ch 6 (2.437 GHz)' },
    { channel_id: 10, protocol_type: 'radiometric_high', frequency_mapping: 'WLAN Ch 11 (2.462 GHz)' },
    { channel_id: 11, protocol_type: 'neural_frontal', frequency_mapping: 'FP1' },
    { channel_id: 12, protocol_type: 'neural_frontal', frequency_mapping: 'AF3' },
    { channel_id: 13, protocol_type: 'neural_frontal', frequency_mapping: 'Fz' },
  ].map((c) => ({ ...c, remap_footprint_id: channelFootprint }));

  return {
    egs_fractal: EGS_FRACTAL,
    unitary_hydrogen_dyad: UNITARY_HYDROGEN_DYAD,
    channel_count: UMBILICAL_CHANNEL_COUNT,
    nav: { x: nav.x, y: nav.y, z: nav.z, conceptId, mode },
    generative_seed: seed,
    attention_mode: mode,
    net_equilibrium: {
      state: 'equilibrium',
      equilibrium_delta: equilibriumDelta,
      coherence_index: coherence,
    },
    umbilical_channel_matrix: channelMap,
    latent_hints: [
      `φ-scaled blend → ${mode}`,
      `seed:${seed}`,
      `concept:${conceptId.slice(0, 48)}`,
      `dyad:proton=${UNITARY_HYDROGEN_DYAD.proton},electron=${UNITARY_HYDROGEN_DYAD.electron}`,
      `umbilical_channels:${UMBILICAL_CHANNEL_COUNT}`,
      `equilibrium_delta:${equilibriumDelta}`,
    ],
  };
}
