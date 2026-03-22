/**
 * Schumann 3 / 6 / 9 Hz ladder + equinox correlation — from live site data snapshot.
 * NSPFRNP → ∞⁹
 */
const FETCH_OPTS = { signal: AbortSignal.timeout(12000) };

function siteBase() {
  const v = process.env.VERCEL_URL;
  if (v && v !== '') return `https://${v.replace(/\/$/, '')}`;
  const u = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://psw-vibelandia-sing9.vercel.app';
  return String(u).replace(/\/$/, '');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const url = `${siteBase()}/data/schumann-equinox-snapshot.json`;
  try {
    const r = await fetch(url, FETCH_OPTS);
    if (!r.ok) {
      return res.status(200).json({
        ok: false,
        service: 'schumann-equinox-probe',
        error: 'snapshot_http_' + r.status,
        url,
        note: 'Deploy data/schumann-equinox-snapshot.json and rebuild dist.',
      });
    }
    const snap = await r.json();
    const ladder = snap.schumann_ladder_hz;
    const equinox_correlated = snap.equinox_correlated === true;
    const has369 =
      Array.isArray(ladder) &&
      [3, 6, 9].every((hz) => ladder.some((x) => Math.abs(Number(x) - hz) < 0.51));

    return res.status(200).json({
      ok: has369 && equinox_correlated,
      service: 'schumann-equinox-probe',
      schumann_ladder_hz: ladder,
      equinox_correlated,
      equinox_instant_utc: snap.equinox_instant_utc || null,
      equinox_window_utc: snap.equinox_window_utc || null,
      source: 'data/schumann-equinox-snapshot.json',
      snapshot_schema: snap.schema || null,
      provenance: snap.provenance || null,
      fetched_at_utc: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(200).json({
      ok: false,
      service: 'schumann-equinox-probe',
      error: e.message || String(e),
      url,
    });
  }
};
