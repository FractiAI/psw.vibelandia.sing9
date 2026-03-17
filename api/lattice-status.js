/**
 * GET /api/lattice-status — Zero-Dish Lattice / Grid-Sync status (read-only)
 *
 * For worldwide deploy & test: any region can GET this to verify the Lattice
 * is live and to obtain the current manifest shape (session_id, frequency_mhz,
 * node, signature). Used by hyperscalers to assert "deployed and testable
 * automatically and instantly, worldwide."
 *
 * Does not run JPL or A2A task; returns current manifest generated on request.
 * Full handshake runs on cron (and optionally when space-cloud was invoked).
 *
 * NSPFRNP → ∞⁹
 */
'use strict';

const { latticeSyncManifest, HILL_SPHERE_KM, HYDROGEN_LINE_MHZ, NODE_NAME } = require('../lib/maser-handshake');

module.exports = (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=60');

  const manifest = latticeSyncManifest();
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://psw-vibelandia-sing9.vercel.app');

  res.status(200).json({
    ok: true,
    service: 'lattice-status',
    spec_version: 'zero_dish_hyperscale_1',
    lattice_sync: manifest,
    constants: {
      hill_sphere_km: HILL_SPHERE_KM,
      hydrogen_line_mhz: HYDROGEN_LINE_MHZ,
      node: NODE_NAME,
    },
    deploy_test: {
      agent_card: `${baseUrl}/.well-known/agent.json`,
      status: `${baseUrl}/api/status`,
      lattice_status: `${baseUrl}/api/lattice-status`,
      executive_pivot: `${baseUrl}/interfaces/executive-cloud-pivot.html`,
      tech_spec_anchor: `${baseUrl}/interfaces/executive-cloud-pivot.html#tech-spec`,
    },
    note: 'Handshake (JPL + A2A task + ledger) runs on cron and on space-cloud invoke. This endpoint returns current manifest only; use for worldwide health and schema assertion.',
  });
};
