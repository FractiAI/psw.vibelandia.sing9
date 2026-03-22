/**
 * Hydrogen rest line + Jupiter / 3I/ATLAS context (JPL catalog + lattice narrative constants).
 * Not L-band RF detection — ephemeris + handshake MHz alignment.
 * NSPFRNP → ∞⁹
 */
const H = 1420.405751;
const FETCH_OPTS = {
  signal: AbortSignal.timeout(18000),
  headers: {
    'User-Agent': 'FractiAI-SING9-JovianHProbe/1.0',
    Accept: 'application/json',
  },
};

function siteBase() {
  const v = process.env.VERCEL_URL;
  if (v && v !== '') return `https://${v.replace(/\/$/, '')}`;
  const u = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://psw-vibelandia-sing9.vercel.app';
  return String(u).replace(/\/$/, '');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  let atlas = null;
  let lattice = null;
  try {
    const r2 = await fetch(`${siteBase()}/lattice-status.json`, FETCH_OPTS);
    if (r2.ok) lattice = await r2.json();
  } catch (_) {}

  try {
    const r = await fetch(
      'https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=' + encodeURIComponent('C/2025 N1') + '&cad=1',
      FETCH_OPTS
    );
    if (r.ok) {
      const data = await r.json();
      const obj = data.object || {};
      atlas = {
        fullname: obj.fullname || null,
        des: obj.des || null,
      };
    }
  } catch (_) {}

  const nodeStr = String(
    (lattice && lattice.lattice_sync && lattice.lattice_sync.node) ||
      (lattice && lattice.constants && lattice.constants.node) ||
      ''
  );
  if (!atlas || !atlas.fullname) {
    if (/atlas|3i|c\/2025|seahawk|jupiter|jovian/i.test(nodeStr)) {
      atlas = {
        fullname: atlas && atlas.fullname ? atlas.fullname : nodeStr || '3I/ATLAS (lattice node)',
        des: (atlas && atlas.des) || 'C/2025 N1',
      };
    }
  }

  const mhz =
    lattice && lattice.constants && lattice.constants.hydrogen_line_mhz != null
      ? Number(lattice.constants.hydrogen_line_mhz)
      : H;
  const mhzOk = Number.isFinite(mhz) && Math.abs(mhz - H) < 0.05;
  const jupiter_context =
    (lattice && lattice.constants && Number(lattice.constants.hill_sphere_km) >= 5e6) ||
    (lattice && lattice.lattice_sync && /jupiter|jovian|seahawk|atlas/i.test(String(lattice.lattice_sync.node || '')));

  const ok = mhzOk && atlas && atlas.fullname && jupiter_context;

  return res.status(200).json({
    ok,
    service: 'jovian-hydrogen-line-probe',
    hydrogen_line_mhz: mhz,
    atlas_fullname: atlas && atlas.fullname,
    atlas_designation: atlas && atlas.des,
    jupiter_context: !!jupiter_context,
    jupiter_relay: !!jupiter_context,
    hill_sphere_km: lattice && lattice.constants && lattice.constants.hill_sphere_km,
    lattice_node: lattice && lattice.lattice_sync && lattice.lattice_sync.node,
    signal_class: 'ephemeris_plus_lattice_hydrogen_mhz',
    note:
      'JPL SBDB + lattice hydrogen MHz + Jovian/Seahawk narrative. Sky 1420 MHz correlation requires observatory pipeline (not this probe).',
    fetched_at_utc: new Date().toISOString(),
  });
};
