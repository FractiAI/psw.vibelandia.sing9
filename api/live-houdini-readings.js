/**
 * Live readings for Houdini / March 20 terminal — real upstreams only (no synthetic values).
 * NOAA SWPC (K-index, solar regions, RTSW IMF), NASA/JPL SBDB (C/2025 N1 ATLAS).
 * NSPFRNP → ∞⁹
 */
const FETCH_OPTS = {
  signal: AbortSignal.timeout(18000),
  headers: {
    'User-Agent': 'FractiAI-SING9-HoudiniTerminal/1.0 (+https://psw-vibelandia-sing9.vercel.app)',
    Accept: 'application/json',
  },
};

function parseLastKp(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return { kp: null, time_tag: null };
  const last = arr[arr.length - 1];
  const raw = last.kp_index ?? last.estimated_kp ?? last.Kp ?? last.kp;
  const n = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
  return {
    kp: Number.isFinite(n) ? n : null,
    time_tag: last.time_tag || last[0] || null,
  };
}

function findAr4392(regions) {
  if (!Array.isArray(regions)) return null;
  const row = regions.find((r) => Number(r.region) === 4392 || String(r.region) === '4392');
  return row || null;
}

function latestRtsw(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    if (r && (r.active === true || r.active === 'true') && typeof r.bt === 'number') {
      return {
        time_tag: r.time_tag,
        source: r.source || 'RTSW',
        bt_nT: r.bt,
        bx_gsm: r.bx_gsm,
        by_gsm: r.by_gsm,
        bz_gsm: r.bz_gsm,
      };
    }
  }
  const last = rows[rows.length - 1];
  if (!last || typeof last.bt !== 'number') return null;
  return {
    time_tag: last.time_tag,
    source: last.source || 'RTSW',
    bt_nT: last.bt,
    bx_gsm: last.bx_gsm,
    by_gsm: last.by_gsm,
    bz_gsm: last.bz_gsm,
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const out = {
    fetched_at_utc: new Date().toISOString(),
    kp: null,
    ar4392: null,
    rtsw: null,
    atlas: null,
    errors: [],
    sources: [],
  };

  async function pull(name, fn) {
    try {
      await fn();
      out.sources.push(name);
    } catch (e) {
      out.errors.push({ step: name, message: e.message || String(e) });
    }
  }

  await pull('noaa_planetary_k', async () => {
    const r = await fetch('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json', FETCH_OPTS);
    if (!r.ok) throw new Error(`planetary_k_index_1m HTTP ${r.status}`);
    const data = await r.json();
    out.kp = parseLastKp(data);
  });

  await pull('noaa_solar_regions', async () => {
    const r = await fetch('https://services.swpc.noaa.gov/json/solar_regions.json', FETCH_OPTS);
    if (!r.ok) throw new Error(`solar_regions HTTP ${r.status}`);
    const data = await r.json();
    out.ar4392 = findAr4392(data);
  });

  await pull('noaa_rtsw_mag', async () => {
    const r = await fetch('https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json', FETCH_OPTS);
    if (!r.ok) throw new Error(`rtsw_mag_1m HTTP ${r.status}`);
    const data = await r.json();
    out.rtsw = latestRtsw(data);
    if (!out.rtsw) throw new Error('No RTSW Bt in payload');
  });

  await pull('jpl_sbdb_atlas', async () => {
    const url =
      'https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=' + encodeURIComponent('C/2025 N1') + '&cad=1';
    const r = await fetch(url, FETCH_OPTS);
    if (!r.ok) throw new Error(`JPL SBDB HTTP ${r.status}`);
    const data = await r.json();
    const obj = data.object || {};
    const orb = data.orbit || {};
    out.atlas = {
      fullname: obj.fullname || null,
      des: obj.des || null,
      spkid: obj.spkid || null,
      kind: obj.kind || null,
      last_obs: orb.last_obs || null,
      epoch: orb.epoch || null,
      q_au: orb.elements && orb.elements.find((e) => e.name === 'q')?.value,
      producer: orb.producer || null,
      signature: data.signature || null,
    };
    if (!out.atlas.fullname) throw new Error('JPL SBDB missing object.fullname');
  });

  return res.status(200).json(out);
};
