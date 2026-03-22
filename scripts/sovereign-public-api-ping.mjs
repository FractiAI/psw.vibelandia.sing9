#!/usr/bin/env node
/**
 * Sovereign public-API ping (CLI only — not a webpage).
 *
 * Uses free public APIs only:
 *   - NOAA SWPC (observatory-context): Kp 1-min + official Kp/Ap table, RTSW L1 mag + wind, F10.7, GOES soft X-ray
 *   - NASA DONKI (optional): geomagnetic storm (GST) list — `NASA_API_KEY` or DEMO_KEY
 *   - NASA/JPL Horizons: geocentric range (delta, AU) for C/2025 N1 (3I/ATLAS)
 *   - NASA/JPL SBDB: small-body identity / orbit metadata
 *   - Local: narrative 369 Hz XOR latch (one period τ = 1/369 s), no third-party call
 *
 * Shared helpers: `lib/observatory-public-evidence.mjs`
 *
 * Run: node scripts/sovereign-public-api-ping.mjs
 *      npm run ping:public
 *
 * Gates mirror the old in-browser story (documented in HOUDINI_EQUINOX_MAGIC_TRICK_METHODOLOGY.md):
 *   - Solar/Kp: green if latest Kp > 6
 *   - Seahawk ToF (narrative): story speed c = 300000 km/s; integer seconds round(dist_km/c) === 2476 (41m 16s clock)
 *   - 369 latch: XOR with 0x369, wait one 369 Hz period, XOR back — recovered === original
 *
 * NSPFRNP → ∞⁹
 */

import { fetchSwpcObservatoryContext, fetchDonkiGst } from '../lib/observatory-public-evidence.mjs';

const FETCH_OPTS = {
  signal: AbortSignal.timeout(25000),
  headers: {
    'User-Agent': 'FractiAI-SING9-SovereignPing/1.0 (+https://github.com/psw-vibelandia-sing9)',
    Accept: 'application/json',
  },
};

const STORY_C_KM_S = 300_000;
const KP_GREEN_IF_GT = 6;
const NARRATIVE_TOF_SECONDS = 2476;
const XOR_KEY = 0x369;
const AU_KM = 149_597_870.7;

function horizonsUtcParam(d) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const y = d.getUTCFullYear();
  const mo = months[d.getUTCMonth()];
  const day = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  return `${y}-${mo}-${day} ${h}:${mi}`;
}

async function fetchLatestKp() {
  const r = await fetch('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json', FETCH_OPTS);
  if (!r.ok) throw new Error(`NOAA planetary_k_index_1m HTTP ${r.status}`);
  const arr = await r.json();
  if (!Array.isArray(arr) || arr.length === 0) throw new Error('Empty Kp array');
  const last = arr[arr.length - 1];
  const raw = last.kp_index ?? last.estimated_kp ?? last.Kp ?? last.kp;
  const n = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
  const kp = Number.isFinite(n) ? n : null;
  return {
    kp,
    time_tag: last.time_tag || null,
    source: 'https://services.swpc.noaa.gov/json/planetary_k_index_1m.json',
  };
}

function parseHorizonsDeltaAu(resultText) {
  const r = resultText || '';
  const i = r.indexOf('$$SOE');
  const e = r.indexOf('$$EOE');
  if (i === -1 || e === -1 || e <= i) return { delta_au: null, row_time: null, raw_lines: [] };
  const block = r.slice(i + 5, e);
  const lines = block
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const dataLines = lines.filter((l) => /^\d{4}-[A-Za-z]{3}-\d{2}\s+\d{2}:\d{2}/.test(l));
  if (dataLines.length === 0) return { delta_au: null, row_time: null, raw_lines: lines.slice(0, 5) };
  const last = dataLines[dataLines.length - 1];
  const m = last.match(
    /^(\d{4}-[A-Za-z]{3}-\d{2}\s+\d{2}:\d{2})\s+([\d.E+-]+)\s+([\d.E+-]+)/,
  );
  if (!m) return { delta_au: null, row_time: null, parse_note: last };
  return {
    row_time: m[1],
    delta_au: parseFloat(m[2]),
    col3: parseFloat(m[3]),
    rows: dataLines.length,
  };
}

async function fetchAtlasEarthRangeAu() {
  const now = new Date();
  const start = new Date(now.getTime() - 60 * 60 * 1000);
  const stop = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  /** Horizons is picky about STEP_SIZE; use literal `1%20h` (URLSearchParams breaks this). */
  const ts = (d) => horizonsUtcParam(d).replace(/ /g, '%20');
  const url =
    'https://ssd.jpl.nasa.gov/api/horizons.api?format=json' +
    "&COMMAND='C%2F2025%20N1'" +
    "&OBJ_DATA='YES'" +
    "&MAKE_EPHEM='YES'" +
    "&EPHEM_TYPE='OBSERVER'" +
    "&CENTER='500@399'" +
    `&START_TIME='${ts(start)}'` +
    `&STOP_TIME='${ts(stop)}'` +
    "&STEP_SIZE='1%20h'" +
    "&QUANTITIES='20'";
  const r = await fetch(url, FETCH_OPTS);
  if (!r.ok) throw new Error(`Horizons HTTP ${r.status}`);
  const j = await r.json();
  if (j.error && String(j.error).toLowerCase().includes('fatal')) {
    throw new Error(j.error);
  }
  const parsed = parseHorizonsDeltaAu(j.result);
  if (parsed.delta_au == null || !Number.isFinite(parsed.delta_au)) {
    throw new Error(j.error || 'Could not parse Horizons delta (range) from result');
  }
  return {
    delta_au: parsed.delta_au,
    distance_km: parsed.delta_au * AU_KM,
    row_time: parsed.row_time,
    horizons_error: j.error || null,
    source: 'https://ssd.jpl.nasa.gov/api/horizons.api',
  };
}

async function fetchSbdbAtlas() {
  /** `cad=1` can return HTTP 400 for some designations; base lookup is enough for identity. */
  const url = 'https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=' + encodeURIComponent('C/2025 N1');
  const r = await fetch(url, FETCH_OPTS);
  if (!r.ok) throw new Error(`SBDB HTTP ${r.status}`);
  const data = await r.json();
  const obj = data.object || {};
  const orb = data.orbit || {};
  return {
    fullname: obj.fullname || null,
    des: obj.des || null,
    spkid: obj.spkid || null,
    last_obs: orb.last_obs || null,
    source: 'https://ssd-api.jpl.nasa.gov/sbdb.api',
  };
}

async function run369Latch() {
  const seed = (Date.now() ^ 0x5eed) >>> 0;
  const flipped = (seed ^ XOR_KEY) >>> 0;
  const tauMs = 1000 / 369;
  await new Promise((res) => setTimeout(res, tauMs));
  const recovered = (flipped ^ XOR_KEY) >>> 0;
  return {
    seed,
    xor_key_hex: `0x${XOR_KEY.toString(16)}`,
    tau_seconds: 1 / 369,
    recovered_ok: recovered === seed,
  };
}

function gateKp(kp) {
  return kp != null && kp > KP_GREEN_IF_GT;
}

function gateTof(distanceKm) {
  const sec = Math.round(distanceKm / STORY_C_KM_S);
  return {
    integer_seconds: sec,
    matches_narrative_41m16s: sec === NARRATIVE_TOF_SECONDS,
    narrative_seconds: NARRATIVE_TOF_SECONDS,
    story_c_km_s: STORY_C_KM_S,
  };
}

function isoDateUTC(d) {
  return d.toISOString().slice(0, 10);
}

async function main() {
  const out = {
    fetched_at_utc: new Date().toISOString(),
    gates: {},
    errors: [],
  };

  const [swpcObs, donkiGst] = await Promise.all([
    fetchSwpcObservatoryContext(FETCH_OPTS),
    (async () => {
      const end = new Date();
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      try {
        return await fetchDonkiGst(isoDateUTC(start), isoDateUTC(end), process.env.NASA_API_KEY);
      } catch (e) {
        return { error: e.message || String(e), source: 'NASA DONKI GST' };
      }
    })(),
  ]);

  out.observatory_public = swpcObs;
  out.nasa_donki_gst = donkiGst;

  let kpRow = null;
  try {
    if (swpcObs.kp_1m && swpcObs.kp_1m.kp != null) {
      kpRow = swpcObs.kp_1m;
    } else {
      kpRow = await fetchLatestKp();
    }
    out.kp = kpRow;
    out.gates.solar_kp_gt_6 = gateKp(kpRow.kp);
  } catch (e) {
    out.errors.push({ step: 'noaa_kp', message: e.message || String(e) });
    out.gates.solar_kp_gt_6 = false;
  }

  try {
    out.atlas_sbdb = await fetchSbdbAtlas();
  } catch (e) {
    out.errors.push({ step: 'jpl_sbdb', message: e.message || String(e) });
  }

  let rangeRow = null;
  try {
    rangeRow = await fetchAtlasEarthRangeAu();
    out.seahawk_range = rangeRow;
    const tof = gateTof(rangeRow.distance_km);
    out.seahawk_tof_narrative = tof;
    out.gates.seahawk_tof_2476s = tof.matches_narrative_41m16s;
  } catch (e) {
    out.errors.push({ step: 'jpl_horizons_range', message: e.message || String(e) });
    out.gates.seahawk_tof_2476s = false;
  }

  try {
    const x = await run369Latch();
    out.xor_369_latch = x;
    out.gates.xor_369_recovered = x.recovered_ok;
  } catch (e) {
    out.errors.push({ step: 'xor_369', message: e.message || String(e) });
    out.gates.xor_369_recovered = false;
  }

  out.gates.all_three_green =
    out.gates.solar_kp_gt_6 === true &&
    out.gates.seahawk_tof_2476s === true &&
    out.gates.xor_369_recovered === true;

  const lines = [];
  lines.push('');
  lines.push('══ Sovereign public API ping ══');
  lines.push(`UTC: ${out.fetched_at_utc}`);
  lines.push('');
  lines.push('── Observatory-grade public data (NOAA SWPC + GOES) ──');
  if (swpcObs.kp_1m) {
    lines.push(`  Kp (1-min): ${swpcObs.kp_1m.kp ?? '—'} @ ${swpcObs.kp_1m.time_tag || '—'}`);
  }
  if (swpcObs.kp_table_3h) {
    const t = swpcObs.kp_table_3h;
    lines.push(`  Kp (3h product): ${t.kp_index ?? '—'} · Ap: ${t.ap_index ?? '—'} · storm: ${t.storm_level ?? '—'} @ ${t.time_tag}`);
  }
  if (swpcObs.g_scale_kp?.label) {
    lines.push(
      `  NOAA G-scale (${swpcObs.g_scale_from_kp_source || 'Kp'}): ${swpcObs.g_scale_kp.label} — ${swpcObs.g_scale_kp.note}`,
    );
  }
  if (swpcObs.f107) {
    lines.push(
      `  F10.7: ${swpcObs.f107.f10_7_sfu ?? '—'} sfu @ ${swpcObs.f107.time_tag || '—'} (90d mean ${swpcObs.f107.ninety_day_mean ?? '—'})`,
    );
  }
  if (swpcObs.rtsw_mag) {
    const m = swpcObs.rtsw_mag;
    lines.push(
      `  RTSW L1 mag (${m.source}): Bt=${m.bt_nT ?? '—'} nT  Bz=${m.bz_gsm ?? '—'} nT @ ${m.time_tag || '—'}`,
    );
  }
  if (swpcObs.rtsw_wind) {
    const w = swpcObs.rtsw_wind;
    lines.push(
      `  RTSW L1 wind: V=${w.proton_speed_km_s ?? '—'} km/s  n=${w.proton_density_cm3 ?? '—'} cm⁻³ @ ${w.time_tag || '—'}`,
    );
  }
  if (swpcObs.goes_xray) {
    const x = swpcObs.goes_xray;
    lines.push(
      `  GOES soft X-ray: ~${x.coarse_class ?? '—'} (${x.coarse_class_detail ?? ''}) flux=${x.flux_w_m2 != null ? x.flux_w_m2.toExponential(3) : '—'} W/m² @ ${x.time_tag || '—'}`,
    );
  }
  if (swpcObs.errors?.length) {
    for (const er of swpcObs.errors) lines.push(`  [partial] ${er.step}: ${er.message}`);
  }
  lines.push('');
  lines.push('── NASA DONKI · geomagnetic storms (7d) ──');
  if (donkiGst.error) {
    lines.push(`  (unavailable) ${donkiGst.error}`);
  } else {
    lines.push(`  Events: ${donkiGst.count ?? donkiGst.events?.length ?? 0} · key=${donkiGst.api_key_used ?? '—'}`);
    const ev = (donkiGst.events || []).slice(-3);
    for (const g of ev) {
      lines.push(`  · ${g.gstid ?? '—'} max Kp≈${g.max_kp_in_event ?? '—'} ${g.start_time ? `from ${g.start_time}` : ''}`);
    }
  }
  lines.push('');
  lines.push('── Story gate · NOAA Kp (same as before) ──');
  if (kpRow) {
    lines.push(`  Kp = ${kpRow.kp ?? 'null'}  (${kpRow.time_tag || 'no time'})`);
    lines.push(`  Gate Kp > ${KP_GREEN_IF_GT}: ${out.gates.solar_kp_gt_6 ? 'GREEN' : 'RED'}`);
  } else {
    lines.push('  (unavailable)');
  }
  lines.push('');
  lines.push('── JPL · C/2025 N1 (ATLAS) ──');
  if (out.atlas_sbdb) {
    lines.push(`  ${out.atlas_sbdb.fullname || 'ATLAS'}  spkid=${out.atlas_sbdb.spkid ?? '—'}`);
  }
  if (rangeRow) {
    lines.push(`  Earth range ≈ ${rangeRow.delta_au.toFixed(6)} au  (${(rangeRow.distance_km / 1e6).toFixed(3)} million km)`);
    lines.push(`  Narrative ToF @ ${STORY_C_KM_S} km/s → ${out.seahawk_tof_narrative.integer_seconds}s (want ${NARRATIVE_TOF_SECONDS}s for 41:16 clock)`);
    lines.push(`  Gate integer ToF === ${NARRATIVE_TOF_SECONDS}: ${out.gates.seahawk_tof_2476s ? 'GREEN' : 'RED'}`);
    if (rangeRow.horizons_error) lines.push(`  Horizons note: ${rangeRow.horizons_error}`);
  } else {
    lines.push('  Range ephemeris: (unavailable)');
  }
  lines.push('');
  lines.push('── Local · 369 Hz XOR latch ──');
  if (out.xor_369_latch) {
    lines.push(`  τ = 1/369 s, key ${out.xor_369_latch.xor_key_hex}, recovered_ok: ${out.xor_369_latch.recovered_ok}`);
    lines.push(`  Gate: ${out.gates.xor_369_recovered ? 'GREEN' : 'RED'}`);
  }
  lines.push('');
  lines.push(`── Summary · all three green: ${out.gates.all_three_green ? 'YES' : 'NO'} ──`);
  if (out.errors.length) {
    lines.push('Errors:');
    for (const er of out.errors) lines.push(`  - ${er.step}: ${er.message}`);
  }
  lines.push('');
  console.log(lines.join('\n'));
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
