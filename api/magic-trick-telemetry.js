/**
 * GET /api/magic-trick-telemetry
 * Real public sensor / operational JSON only — NOAA SWPC, GOES (via SWPC), RTSW.
 * Catalog constants: H I rest frequency (IAU), Crab pulsar published period (ATNF-class ephemeris).
 * Does NOT fabricate KiwiSDR aggregate, grid harmonics, or EGS "1.0000" — those are not NOAA products.
 * NSPFRNP → ∞⁹
 */

const FETCH_OPTS = { signal: AbortSignal.timeout(22000) };

/** IAU / radio-astronomy standard H I rest frequency (MHz). */
const H_I_REST_MHZ = 1420.405751;

/** Published Crab pulsar ephemeris (catalog class — not live timing from this endpoint). */
const CRAB_PERIOD_S = 0.033564095;
const CRAB_PSR = {
  designation: 'PSR B0531+21',
  period_s: CRAB_PERIOD_S,
  spin_hz: 1 / CRAB_PERIOD_S,
  source: 'ATNF / standard pulsar catalog parameters (public literature)',
};

function parseKpRow(row) {
  if (!row) return { kp: null, time_tag: null };
  const raw = row.kp_index ?? row.estimated_kp ?? row.Kp ?? row.kp;
  const n = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
  return {
    kp: Number.isFinite(n) ? n : null,
    time_tag: row.time_tag || null,
  };
}

function fmtKpStorm(kp, gScale) {
  if (kp == null || !Number.isFinite(kp)) return 'Kp unavailable (NOAA)';
  const g = gScale?.label || 'G?';
  const note = gScale?.note || '';
  return 'Kp ' + kp.toFixed(1) + ' — ' + g + ' · ' + note;
}

function fmtTimeTag(tag) {
  if (!tag) return '—';
  const s = String(tag).trim().replace(' ', 'T');
  const d = new Date(/Z$/i.test(s) ? s : s + 'Z');
  if (Number.isNaN(d.getTime())) return String(tag);
  try {
    return d.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return d.toISOString();
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const mod = await import('../lib/observatory-public-evidence.mjs');
    const { fetchSwpcObservatoryContext, kpToGScale } = mod;

    const kp1mRes = await fetch(
      'https://services.swpc.noaa.gov/json/planetary_k_index_1m.json',
      FETCH_OPTS
    );
    if (!kp1mRes.ok) throw new Error('NOAA planetary_k_index_1m HTTP ' + kp1mRes.status);
    const kp1mArr = await kp1mRes.json();

    let priorRow = null;
    let latestRow = null;
    if (Array.isArray(kp1mArr) && kp1mArr.length >= 2) {
      priorRow = kp1mArr[kp1mArr.length - 2];
      latestRow = kp1mArr[kp1mArr.length - 1];
    } else if (Array.isArray(kp1mArr) && kp1mArr.length === 1) {
      priorRow = latestRow = kp1mArr[0];
    }

    const prior = parseKpRow(priorRow);
    const latest = parseKpRow(latestRow);

    const ctx = await fetchSwpcObservatoryContext(FETCH_OPTS);

    const gPrior = kpToGScale(prior.kp);
    const gLatest = kpToGScale(latest.kp);

    const wind = ctx.rtsw_wind;
    const mag = ctx.rtsw_mag;
    const goes = ctx.goes_xray;
    const f107 = ctx.f107;

    const windStr =
      wind && wind.proton_speed_km_s != null
        ? 'RTSW L1 solar wind speed ' +
          Number(wind.proton_speed_km_s).toFixed(0) +
          ' km/s · density ' +
          (wind.proton_density_cm3 != null ? Number(wind.proton_density_cm3).toFixed(2) + ' p/cm³' : 'n/a') +
          ' @ ' +
          (wind.time_tag || '—')
        : 'RTSW wind unavailable';

    const magStr =
      mag && mag.bt_nT != null
        ? '|B| ' + Number(mag.bt_nT).toFixed(1) + ' nT · Bz ' + (mag.bz_gsm != null ? Number(mag.bz_gsm).toFixed(1) : '—') + ' nT @ ' + (mag.time_tag || '—')
        : 'RTSW mag unavailable';

    const goesStr =
      goes && goes.flux_w_m2 != null
        ? 'GOES soft X-ray ' +
          goes.flux_w_m2.toExponential(2) +
          ' W/m² · class ' +
          (goes.coarse_class || '—') +
          ' @ ' +
          (goes.time_tag || '—')
        : 'GOES X-ray unavailable';

    const deltaKp =
      prior.kp != null && latest.kp != null && Number.isFinite(prior.kp) && Number.isFinite(latest.kp)
        ? (latest.kp - prior.kp).toFixed(2)
        : null;

    const stormA = fmtKpStorm(prior.kp, gPrior) + ' · ' + fmtTimeTag(prior.time_tag);
    const stormB = fmtKpStorm(latest.kp, gLatest) + ' · ' + fmtTimeTag(latest.time_tag);

    const blackoutA = goesStr + ' (same operational GOES product as column B)';
    const blackoutB = goesStr;

    const whistleA =
      'H I ' +
      H_I_REST_MHZ +
      ' MHz (standard rest) · ' +
      windStr +
      ' — NOAA/SWPC operational context';
    const whistleB = whistleA;

    const crabA =
      'PSR B0531+21 · period ' +
      CRAB_PSR.period_s +
      ' s (~' +
      CRAB_PSR.spin_hz.toFixed(3) +
      ' Hz) · ' +
      CRAB_PSR.source +
      ' — not live phase-lock from this page';
    const crabB = crabA;

    const crabC =
      'Ledger · ' +
      CRAB_PSR.designation +
      ' · catalog period ' +
      CRAB_PSR.period_s +
      ' s — public ephemeris class data';

    const kiwiA =
      'No public aggregate API for KiwiSDR nodes — open receivers at kiwisdr.com · tune H I near ' +
      H_I_REST_MHZ +
      ' MHz manually';
    const kiwiB = kiwiA;
    const kiwiC =
      'No sensor stream here — H I ' +
      H_I_REST_MHZ +
      ' MHz rest is standard; KiwiSDR is third-party open Web SDR';

    const groundA = magStr + ' · ' + windStr;
    const groundB = groundA;
    const groundC =
      'RTSW L1 (ACE/DSCOVR chain) + GOES — same feeds as A/B; no standalone Schumann/grid API in this pipeline';

    const phaseA =
      deltaKp != null
        ? 'ΔKp (latest − prior 1-min) = ' + deltaKp + ' — not an EGS operational product'
        : 'ΔKp unavailable';
    const phaseB = phaseA;
    const phaseC =
      'No EGS / “1.0000” sensor from NOAA — compare Kp delta above; grid harmonics not in SWPC JSON';

    const table_headers = {
      a: {
        line1: 'Snapshot A · Prior NOAA 1-min Kp',
        line2: 'The Mirror · ' + fmtTimeTag(prior.time_tag),
      },
      b: {
        line1: 'Snapshot B · Latest NOAA 1-min Kp',
        line2: 'The Flip · ' + fmtTimeTag(latest.time_tag),
      },
      c: {
        line1: 'Ledger · catalog + operational',
        line2: 'H I rest · Crab ephemeris · NOAA summary (same fetch)',
      },
    };

    const rows = [
      { key: 'The Storm', a: stormA, b: stormB, c: 'NOAA SWPC Kp 1-min + G-scale (3h table when present) · fetched ' + ctx.fetched_at_utc },
      { key: 'The Blackout', a: blackoutA, b: blackoutB, c: 'Ionosphere context: GOES soft X-ray (operational); HF blackout uses NOAA scales elsewhere' },
      { key: 'The Whistle', a: whistleA, b: whistleB, c: 'H I rest + RTSW solar wind — operational heliophysics JSON' },
      { key: 'Crab Pulsar — PSR B0531+21', a: crabA, b: crabB, c: crabC },
      { key: 'Sky — KiwiSDR · H I', a: kiwiA, b: kiwiB, c: kiwiC },
      { key: 'Ground — RTSW / L1', a: groundA, b: groundB, c: groundC },
      { key: 'Phase delta / EGS', a: phaseA, b: phaseB, c: phaseC },
    ];

    return res.status(200).json({
      ok: true,
      service: 'magic-trick-telemetry',
      fetched_at_utc: ctx.fetched_at_utc,
      sources: {
        noaa_kp_1m: 'https://services.swpc.noaa.gov/json/planetary_k_index_1m.json',
        noaa_products: ctx.provenance || [],
        hydrogen_line_mhz: H_I_REST_MHZ,
        hydrogen_line_note: 'Standard H I rest frequency (radio astronomy)',
        crab_pulsar: CRAB_PSR,
      },
      snapshot_labels: {
        a: 'Prior NOAA 1-min Kp',
        b: 'Latest NOAA 1-min Kp',
        c: 'Catalog + operational summary',
      },
      table_headers,
      kp_samples: {
        prior_1m: prior,
        latest_1m: latest,
      },
      rows,
      swpc_errors: ctx.errors || [],
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      service: 'magic-trick-telemetry',
      error: e.message || String(e),
    });
  }
};
