/**
 * Observatory-context evidence from **public** operational feeds (no auth unless noted).
 * Same families of data space-weather and ephemeris desks use for situational awareness.
 *
 * Sources (document in outputs):
 *   - NOAA SWPC JSON: Kp 1-min, official Kp table + Ap, RTSW L1 mag (ACE/DSCOVR), RTSW wind, F10.7, GOES X-ray
 *   - NASA DONKI: geomagnetic storms (GST), optional `NASA_API_KEY` or `DEMO_KEY`
 *   - JPL Horizons / SBDB: used from sovereign ping script (catalog ephemeris)
 *
 * This module does **not** claim L-band radio detection of the comet — only geospace + catalog context.
 *
 * NSPFRNP → ∞⁹
 */

/** NOAA operational G-scale (geomagnetic storms) from 3-hourly Kp. https://www.swpc.noaa.gov/noaa-scales-explanation */
export function kpToGScale(kp) {
  if (kp == null || !Number.isFinite(kp)) return { g: null, label: null, note: 'Kp unavailable' };
  if (kp < 5) return { g: 0, label: 'below G1', note: 'Kp < 5 — no G-scale storm per NOAA table' };
  if (kp < 6) return { g: 1, label: 'G1', note: 'Kp 5–5.99 → G1 minor' };
  if (kp < 7) return { g: 2, label: 'G2', note: 'Kp 6–6.99 → G2 moderate' };
  if (kp < 8) return { g: 3, label: 'G3', note: 'Kp 7–7.99 → G3 strong' };
  if (kp < 9) return { g: 4, label: 'G4', note: 'Kp 8–8.99 → G4 severe' };
  return { g: 5, label: 'G5', note: 'Kp ≥ 9 → G5 extreme' };
}

/** GOES soft X-ray flux (W/m²) → coarse class (A/B/C/M/X). */
export function goesSoftXrayClass(fluxWm2) {
  if (fluxWm2 == null || !Number.isFinite(fluxWm2) || fluxWm2 <= 0) {
    return { cls: null, detail: null };
  }
  const f = fluxWm2;
  const x = Math.log10(f);
  if (x < -7) return { cls: 'A', detail: 'quiet-to-active' };
  if (x < -6) return { cls: 'B', detail: 'low C-class floor' };
  if (x < -5) return { cls: 'C', detail: 'C-class range' };
  if (x < -4) return { cls: 'M', detail: 'M-class range' };
  return { cls: 'X', detail: 'X-class range' };
}

function latestRtswMag(rows) {
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

function latestRtswWind(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const last = rows[rows.length - 1];
  if (!last) return null;
  return {
    time_tag: last.time_tag,
    source: last.source || 'RTSW',
    active: last.active,
    proton_speed_km_s: last.proton_speed,
    proton_density_cm3: last.proton_density,
    proton_temperature_K: last.proton_temperature,
  };
}

/**
 * Fetch NOAA SWPC + GOES primary X-ray (last 6h window file — operational product).
 * @param {RequestInit & { signal?: AbortSignal }} fetchOpts
 */
export async function fetchSwpcObservatoryContext(fetchOpts) {
  const opts = fetchOpts || {};
  const errors = [];

  const kp1mP = fetch('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json', opts).then(async (r) => {
    if (!r.ok) throw new Error(`planetary_k_index_1m HTTP ${r.status}`);
    return r.json();
  });
  const kpTableP = fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json', opts).then(async (r) => {
    if (!r.ok) throw new Error(`noaa-planetary-k-index HTTP ${r.status}`);
    return r.json();
  });
  const magP = fetch('https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json', opts).then(async (r) => {
    if (!r.ok) throw new Error(`rtsw_mag_1m HTTP ${r.status}`);
    return r.json();
  });
  const windP = fetch('https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json', opts).then(async (r) => {
    if (!r.ok) throw new Error(`rtsw_wind_1m HTTP ${r.status}`);
    return r.json();
  });
  const f107P = fetch('https://services.swpc.noaa.gov/json/f107_cm_flux.json', opts).then(async (r) => {
    if (!r.ok) throw new Error(`f107_cm_flux HTTP ${r.status}`);
    return r.json();
  });
  const xrayP = fetch('https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json', opts).then(async (r) => {
    if (!r.ok) throw new Error(`goes xrays-6-hour HTTP ${r.status}`);
    return r.json();
  });

  const [kp1mArr, kpTable, magArr, windArr, f107Arr, xrayArr] = await Promise.all([
    kp1mP.catch((e) => {
      errors.push({ step: 'kp_1m', message: e.message });
      return null;
    }),
    kpTableP.catch((e) => {
      errors.push({ step: 'kp_table', message: e.message });
      return null;
    }),
    magP.catch((e) => {
      errors.push({ step: 'rtsw_mag', message: e.message });
      return null;
    }),
    windP.catch((e) => {
      errors.push({ step: 'rtsw_wind', message: e.message });
      return null;
    }),
    f107P.catch((e) => {
      errors.push({ step: 'f107', message: e.message });
      return null;
    }),
    xrayP.catch((e) => {
      errors.push({ step: 'goes_xray', message: e.message });
      return null;
    }),
  ]);

  let kp_1m = null;
  if (Array.isArray(kp1mArr) && kp1mArr.length) {
    const last = kp1mArr[kp1mArr.length - 1];
    const raw = last.kp_index ?? last.estimated_kp ?? last.Kp ?? last.kp;
    const n = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
    kp_1m = {
      kp: Number.isFinite(n) ? n : null,
      time_tag: last.time_tag || null,
      source: 'https://services.swpc.noaa.gov/json/planetary_k_index_1m.json',
    };
  }

  let kp_table_3h = null;
  if (Array.isArray(kpTable) && kpTable.length >= 2) {
    const last = kpTable[kpTable.length - 1];
    if (Array.isArray(last) && last.length >= 3) {
      const kp = parseFloat(last[1]);
      const ap = parseFloat(last[2]);
      kp_table_3h = {
        time_tag: String(last[0] || ''),
        kp_index: Number.isFinite(kp) ? kp : null,
        ap_index: Number.isFinite(ap) ? ap : null,
        storm_level: last[3] != null ? String(last[3]) : null,
        source: 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
      };
    }
  }

  const rtsw_mag = latestRtswMag(magArr);
  const rtsw_wind = latestRtswWind(windArr);

  let f107 = null;
  if (Array.isArray(f107Arr) && f107Arr.length) {
    const last = f107Arr[0];
    const flux = typeof last.flux === 'number' ? last.flux : parseFloat(last.flux);
    f107 = {
      f10_7_sfu: Number.isFinite(flux) ? flux : null,
      time_tag: last.time_tag || null,
      ninety_day_mean: last.ninety_day_mean ?? null,
      source: 'https://services.swpc.noaa.gov/json/f107_cm_flux.json',
    };
  }

  let goes_xray = null;
  if (Array.isArray(xrayArr) && xrayArr.length) {
    const last = xrayArr[xrayArr.length - 1];
    const flux = last.observed_flux ?? last.flux;
    const f = typeof flux === 'number' ? flux : parseFloat(flux);
    const cls = goesSoftXrayClass(f);
    goes_xray = {
      time_tag: last.time_tag || null,
      satellite: last.satellite ?? null,
      flux_w_m2: Number.isFinite(f) ? f : null,
      energy_band: last.energy || null,
      coarse_class: cls.cls,
      coarse_class_detail: cls.detail,
      source: 'https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json',
    };
  }

  /** NOAA storm / G-scale messaging uses the **3-hour** planetary K index; 1-min is situational. */
  const kp_for_g_scale = kp_table_3h?.kp_index ?? kp_1m?.kp ?? null;

  return {
    fetched_at_utc: new Date().toISOString(),
    kp_1m,
    kp_table_3h,
    g_scale_kp: kpToGScale(kp_for_g_scale),
    g_scale_from_kp_source:
      kp_table_3h?.kp_index != null
        ? '3h product (noaa-planetary-k-index.json)'
        : kp_1m?.kp != null
          ? '1-min (planetary_k_index_1m.json)'
          : null,
    rtsw_mag,
    rtsw_wind,
    f107,
    goes_xray,
    errors,
    provenance: [
      'NOAA SWPC services.swpc.noaa.gov — operational space-weather JSON feeds',
      'GOES X-ray — primary GOES instrument JSON (same public distribution as SWPC)',
    ],
  };
}

/**
 * NASA DONKI geomagnetic storms (GST) in [startDate, endDate] (YYYY-MM-DD UTC).
 * Uses api.nasa.gov (set `NASA_API_KEY` or falls back to DEMO_KEY).
 */
export async function fetchDonkiGst(startDate, endDate, apiKey) {
  const key = apiKey || process.env.NASA_API_KEY || 'DEMO_KEY';
  const u = new URL('https://api.nasa.gov/DONKI/GST');
  u.searchParams.set('startDate', startDate);
  u.searchParams.set('endDate', endDate);
  u.searchParams.set('api_key', key);
  const r = await fetch(u, { signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`DONKI GST HTTP ${r.status}`);
  const arr = await r.json();
  if (!Array.isArray(arr)) return { events: [], source: u.origin + u.pathname + ' (NASA DONKI)' };
  const summarized = arr.map((g) => {
    const kps = Array.isArray(g.allKpIndex) ? g.allKpIndex : [];
    const maxKp = kps.reduce((m, row) => {
      const v = row.kpIndex;
      const n = typeof v === 'number' ? v : parseFloat(v);
      return Number.isFinite(n) ? Math.max(m, n) : m;
    }, -1);
    return {
      gstid: g.gstID,
      start_time: g.startTime,
      max_kp_in_event: maxKp >= 0 ? maxKp : null,
      link: g.link || null,
    };
  });
  return {
    events: summarized,
    count: summarized.length,
    source: 'https://api.nasa.gov/DONKI/GST (CCMC/GSFC archive)',
    api_key_used: key === 'DEMO_KEY' ? 'DEMO_KEY' : 'NASA_API_KEY',
  };
}
