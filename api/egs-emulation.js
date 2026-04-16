/**
 * EGS emulation — latent-style vectors offloaded to serverless (deterministic φ math, no local ML).
 *
 * GET /api/egs-emulation?concept=...
 * POST /api/egs-emulation  body: { conceptId?, nav?, prior_seed? }
 *
 * NSPFRNP → ∞⁹
 */

const parseJsonBody = require('../lib/parse-json-body.js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  let mod;
  try {
    mod = await import('../lib/egs-fractal-engine.mjs');
  } catch (e) {
    return res.status(500).json({
      ok: false,
      service: 'egs-emulation',
      error: 'import_kernel_failed',
      message: e.message || String(e),
    });
  }

  const { EGS_FRACTAL, emulateEgsPayload, computeGenerativeSeed } = mod;

  let conceptId = 'ground';
  /** @type {{ x: number, y: number, z: number } | undefined} */
  let current;
  let priorSeed = 0;

  if (req.method === 'GET') {
    const q = req.query || {};
    conceptId = typeof q.concept === 'string' && q.concept.trim() ? q.concept.trim() : 'ground';
  } else if (req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      conceptId =
        typeof body.conceptId === 'string' && body.conceptId.trim()
          ? body.conceptId.trim()
          : typeof body.concept === 'string' && body.concept.trim()
            ? body.concept.trim()
            : 'ground';
      if (body.nav && typeof body.nav === 'object') {
        const nx = Number(body.nav.x);
        const ny = Number(body.nav.y);
        const nz = Number(body.nav.z);
        if ([nx, ny, nz].every((n) => Number.isFinite(n))) {
          current = {
            x: Math.min(1, Math.max(0, nx)),
            y: Math.min(1, Math.max(0, ny)),
            z: Math.min(1, Math.max(0, nz)),
          };
        }
      }
      if (body.prior_seed != null) priorSeed = Number(body.prior_seed) | 0;
    } catch {
      return res.status(400).json({ ok: false, error: 'invalid_json' });
    }
  } else {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const base = emulateEgsPayload(conceptId, current);
  const navVec = base.nav;
  const seed =
    priorSeed !== 0
      ? computeGenerativeSeed(
          { x: navVec.x, y: navVec.y, z: navVec.z },
          priorSeed >>> 0
        )
      : base.generative_seed;

  const mode = navVec.mode;

  return res.status(200).json({
    ok: true,
    service: 'egs-emulation',
    egs_fractal: EGS_FRACTAL,
    generative_seed: seed,
    neural_attention_vector: {
      x: navVec.x,
      y: navVec.y,
      z: navVec.z,
      concept_id: conceptId,
      attention: mode,
    },
    viewport: {
      mode: mode === 'internal' ? 'holographic_thought' : 'reno_truckee_external',
      go_pro_awareness: true,
    },
    latent_hints: base.latent_hints,
    human_intervention_required: false,
  });
};
