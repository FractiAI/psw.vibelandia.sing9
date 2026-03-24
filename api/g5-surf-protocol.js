/**
 * G5 SURF Protocol — **Vercel Node.js Serverless** (not Edge Runtime).
 *
 * GET /api/g5-surf-protocol
 *   **No human intervention required** — no API key, no mandatory query params.
 *   Optional: `legacy_grid_ok=0|1` (tests) or env `LEGACY_GRID_OK` (deploy-time, still zero-touch).
 *
 * Fetches NOAA Kp (latest 1-min), evaluates lattice state in `lib/g5-surf-protocol.mjs`.
 * NSPFRNP → ∞⁹
 */

const FETCH_OPTS = { signal: AbortSignal.timeout(20000) };

/** Resolve grid narrative flag without a human in the loop. Query overrides env; default = nominal grid. */
function resolveLegacyGridOk(query) {
  const q = query || {};
  const qs = q.legacy_grid_ok;
  if (qs === '0' || qs === 'false' || qs === false) return false;
  if (qs === '1' || qs === 'true' || qs === true) return true;
  const env = process.env.LEGACY_GRID_OK;
  if (env === '0' || env === 'false') return false;
  if (env === '1' || env === 'true') return true;
  return true;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const q = req.query || {};
  const legacyGridOk = resolveLegacyGridOk(q);

  let mod;
  try {
    mod = await import('../lib/g5-surf-protocol.mjs');
  } catch (e) {
    return res.status(500).json({
      ok: false,
      service: 'g5-surf-protocol',
      error: 'import_kernel_failed',
      message: e.message || String(e),
    });
  }

  const { fetchLatestKpForG5Surf, evaluateG5SurfProtocol, recommendedSyntheverseUiMode } = mod;

  let kpRow;
  let kpError;
  try {
    kpRow = await fetchLatestKpForG5Surf(FETCH_OPTS);
  } catch (e) {
    kpError = e.message || String(e);
    kpRow = { kp: null, time_tag: null, source: null };
  }

  const kp = kpRow.kp;
  const g5 = evaluateG5SurfProtocol({ kp });
  const syntheverse_ui_mode = recommendedSyntheverseUiMode({ kp, legacyGridOk });

  const body = {
    ok: kpError == null,
    service: 'g5-surf-protocol',
    /** Contract: integrators and agents may rely on this — no approval step in this API. */
    human_intervention_required: false,
    automation: {
      kp_fetch: 'noaa_swpc_planetary_k_index_1m',
      evaluation: 'lib/g5-surf-protocol.mjs',
      note: 'Single GET returns full state; optional Vercel Cron keeps polling without human CLI.',
    },
    runtime: {
      platform: 'vercel',
      /** Node.js serverless function — not Vercel Edge Middleware / Edge Functions. */
      execution: 'nodejs-serverless',
      vercel_env: process.env.VERCEL_ENV || null,
    },
    fetched_at_utc: new Date().toISOString(),
    kp_1m: kpRow,
    kp_error: kpError || null,
    g5_surf_protocol: g5,
    syntheverse_ui_mode,
    legacy_grid_ok: legacyGridOk,
    legacy_grid_ok_source:
      q.legacy_grid_ok !== undefined && q.legacy_grid_ok !== ''
        ? 'query'
        : process.env.LEGACY_GRID_OK !== undefined && process.env.LEGACY_GRID_OK !== ''
          ? 'env'
          : 'default_nominal',
    protocol_doc: '/protocols/G5_SURF_PROTOCOL_NSPFRNP.md',
  };

  return res.status(200).json(body);
};
