/**
 * Live readings for Houdini / March 20 terminal — real upstreams only.
 * Modes:
 *   default — latest NOAA Kp / regions / RTSW + JPL SBDB (C/2025 N1 ATLAS)
 *   ?equinox=1 — samples restricted to Mar 20 2026 equinox window (UTC), with optional /data snapshot fallback
 * NSPFRNP → ∞⁹
 */
const FETCH_OPTS = {
  signal: AbortSignal.timeout(18000),
  headers: {
    'User-Agent': 'FractiAI-SING9-HoudiniTerminal/1.0 (+https://psw-vibelandia-sing9.vercel.app)',
    Accept: 'application/json',
  },
};

/** Vernal equinox 2026 (UTC) + sampling window around theater “7:46” narrative. */
const EQUINOX_INSTANT_UTC = new Date('2026-03-20T09:46:23.000Z');
const EQUINOX_WIN_START = new Date('2026-03-20T06:00:00.000Z');
const EQUINOX_WIN_END = new Date('2026-03-20T18:00:00.000Z');
const EQUINOX_DATE = '2026-03-20';

function parseNoaaTimeTag(tag) {
  if (!tag) return null;
  const s = String(tag).trim().replace(' ', 'T');
  const d = new Date(/Z$/i.test(s) ? s : s + 'Z');
  return Number.isNaN(d.getTime()) ? null : d;
}

function inEquinoxWindow(d) {
  return d && d >= EQUINOX_WIN_START && d <= EQUINOX_WIN_END;
}

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

function equinoxKpFromArray(data) {
  if (!Array.isArray(data)) return { samples: [], kp_max: null, kp_at_tag: null, closest: null };
  const samples = [];
  for (const row of data) {
    const tag = row.time_tag;
    const d = parseNoaaTimeTag(tag);
    if (!d || !inEquinoxWindow(d)) continue;
    const raw = row.kp_index ?? row.estimated_kp ?? row.Kp ?? row.kp;
    const kp = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
    if (!Number.isFinite(kp)) continue;
    samples.push({ time_tag: tag, kp_index: kp, _d: d });
  }
  if (samples.length === 0) return { samples: [], kp_max: null, kp_at_tag: null, closest: null };
  let kp_max = -1;
  let kp_at_tag = null;
  for (const s of samples) {
    if (s.kp_index > kp_max) {
      kp_max = s.kp_index;
      kp_at_tag = s.time_tag;
    }
  }
  let closest = samples[0];
  let bestDt = Math.abs(samples[0]._d - EQUINOX_INSTANT_UTC);
  for (const s of samples) {
    const dt = Math.abs(s._d - EQUINOX_INSTANT_UTC);
    if (dt < bestDt) {
      bestDt = dt;
      closest = s;
    }
  }
  return {
    samples,
    kp_max,
    kp_at_tag,
    closest: closest ? { time_tag: closest.time_tag, kp_index: closest.kp_index } : null,
  };
}

function equinoxAr4392FromRegions(data) {
  if (!Array.isArray(data)) return null;
  const dayRows = data.filter((r) => r.observed_date === EQUINOX_DATE);
  const pool = dayRows.length ? dayRows : data;
  return findAr4392(pool);
}

function equinoxRtswFromArray(data) {
  if (!Array.isArray(data)) return null;
  const samples = [];
  for (const row of data) {
    if (typeof row.bt !== 'number') continue;
    const d = parseNoaaTimeTag(row.time_tag);
    if (!d || !inEquinoxWindow(d)) continue;
    if (row.active !== true && row.active !== 'true') continue;
    samples.push({ ...row, _d: d });
  }
  if (samples.length === 0) return null;
  let best = samples[0];
  let bestDt = Math.abs(samples[0]._d - EQUINOX_INSTANT_UTC);
  for (const s of samples) {
    const dt = Math.abs(s._d - EQUINOX_INSTANT_UTC);
    if (dt < bestDt) {
      bestDt = dt;
      best = s;
    }
  }
  return {
    time_tag: best.time_tag,
    source: best.source || 'RTSW',
    bt_nT: best.bt,
    bx_gsm: best.bx_gsm,
    by_gsm: best.by_gsm,
    bz_gsm: best.bz_gsm,
  };
}

function applySnapshot(out, snap) {
  if (!snap || typeof snap !== 'object') return false;
  let used = false;
  if (Array.isArray(snap.kp_samples) && snap.kp_samples.length) {
    const synthetic = snap.kp_samples.map((r) => ({
      time_tag: r.time_tag,
      kp_index: r.kp_index ?? r.kp,
      estimated_kp: r.estimated_kp,
    }));
    const eq = equinoxKpFromArray(synthetic);
    if (eq.samples.length && eq.closest) {
      out.equinox.kp_max = eq.kp_max;
      out.equinox.kp_at_tag = eq.kp_at_tag;
      out.equinox.kp_closest_to_instant = eq.closest;
      out.equinox.kp_sample_count = eq.samples.length;
      out.kp = { kp: eq.closest.kp_index, time_tag: eq.closest.time_tag };
      used = true;
    }
  }
  if (snap.ar4392 && (snap.ar4392.region === 4392 || String(snap.ar4392.region) === '4392')) {
    out.ar4392 = snap.ar4392;
    out.equinox.ar4392 = snap.ar4392;
    used = true;
  }
  if (snap.rtsw && typeof snap.rtsw.bt_nT === 'number') {
    out.rtsw = snap.rtsw;
    out.equinox.rtsw = snap.rtsw;
    used = true;
  }
  return used;
}

async function tryLoadSnapshot() {
  const base =
    process.env.VERCEL_URL != null && process.env.VERCEL_URL !== ''
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://psw-vibelandia-sing9.vercel.app';
  const url = `${base.replace(/\/$/, '')}/data/equinox-2026-03-20-noaa-snapshot.json`;
  try {
    const r = await fetch(url, FETCH_OPTS);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function runEquinoxMode(out, pull) {
  out.mode = 'equinox';
  out.equinox_window_utc = {
    start: EQUINOX_WIN_START.toISOString(),
    end: EQUINOX_WIN_END.toISOString(),
    instant: EQUINOX_INSTANT_UTC.toISOString(),
  };
  out.equinox = {
    found: false,
    kp_max: null,
    kp_at_tag: null,
    kp_closest_to_instant: null,
    kp_sample_count: 0,
    ar4392: null,
    rtsw: null,
    snapshot_used: false,
  };

  let kpArr;
  let regArr;
  let rtswArr;

  await pull('noaa_planetary_k_equinox', async () => {
    const r = await fetch('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json', FETCH_OPTS);
    if (!r.ok) throw new Error(`planetary_k_index_1m HTTP ${r.status}`);
    kpArr = await r.json();
    const eq = equinoxKpFromArray(kpArr);
    out.equinox.kp_sample_count = eq.samples.length;
    out.equinox.kp_max = eq.kp_max;
    out.equinox.kp_at_tag = eq.kp_at_tag;
    out.equinox.kp_closest_to_instant = eq.closest;
    if (eq.closest) {
      out.kp = { kp: eq.closest.kp_index, time_tag: eq.closest.time_tag };
    } else {
      out.kp = { kp: null, time_tag: null };
    }
  });

  await pull('noaa_solar_regions_equinox', async () => {
    const r = await fetch('https://services.swpc.noaa.gov/json/solar_regions.json', FETCH_OPTS);
    if (!r.ok) throw new Error(`solar_regions HTTP ${r.status}`);
    regArr = await r.json();
    const ar = equinoxAr4392FromRegions(regArr);
    out.ar4392 = ar;
    out.equinox.ar4392 = ar;
  });

  await pull('noaa_rtsw_mag_equinox', async () => {
    const r = await fetch('https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json', FETCH_OPTS);
    if (!r.ok) throw new Error(`rtsw_mag_1m HTTP ${r.status}`);
    rtswArr = await r.json();
    const row = equinoxRtswFromArray(rtswArr);
    out.rtsw = row;
    out.equinox.rtsw = row;
  });

  const hasKp = out.kp && out.kp.kp != null;
  const hasAr = out.ar4392 != null;
  const hasRtsw = out.rtsw != null;
  out.equinox.found = hasKp && hasAr && hasRtsw;

  if (!out.equinox.found) {
    const snap = await tryLoadSnapshot();
    if (snap && applySnapshot(out, snap)) {
      out.equinox.snapshot_used = true;
      out.equinox.found =
        out.kp && out.kp.kp != null && out.ar4392 != null && out.rtsw != null;
    }
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const q = req.query || {};
  const equinox =
    q.equinox === '1' ||
    q.equinox === 'true' ||
    q.mode === 'equinox' ||
    (typeof req.url === 'string' && req.url.includes('equinox=1'));

  const out = {
    fetched_at_utc: new Date().toISOString(),
    mode: equinox ? 'equinox' : 'latest',
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

  if (equinox) {
    await runEquinoxMode(out, pull);
  } else {
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
  }

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
