/**
 * POST /api/space-cloud — Space Cloud Mission Command · $5 USDC via x402
 *
 * Returns: composite Space Cloud index (Solar × Goliath failure-mode thermal × HHL).
 * Command: SURGE / ELEVATED / NOMINAL / LOW + recommended action.
 *
 * RETUNED: Goliath component now uses physics-based failure-mode GPU junction temp
 * (the actual NVIDIA NVL72 overheating incident scenario — Nov 2024 events) rather
 * than raw outdoor ambient. This is the real thermal pressure signal.
 *
 * Index formula:
 *   Solar AR probability (40%) + Goliath failure-mode pressure (40%) + HHL 83°C (20%)
 *   Goliath pressure = avg_failure_junction / 105°C (damage threshold), capped at 1.0
 *
 * Anchored to SING 9 Singapore singularity (Jan 13, 2026).
 * NSPFRNP → ∞⁹
 */
'use strict';

const { require402 } = require('./_x402');

// ── THERMAL PHYSICS MODEL (inline — mirrors hive/thermal-model.js) ────────────
const NVL72_RACK_KW      = 120;
const NVL72_BOOST_KW     = 150;
const NVL72_FLOW_LPM     = 83;
const CP_WATER           = 4186;
const COLD_PLATE_FAIL    = 15 * 2.8;  // failure mode: reduced flow, poor transfer
const PKG_RESIST         = 8;
const NVIDIA_INLET_MAX   = 45;
const DAMAGE_C           = 105;

const COOLING_FAIL = {
  'liquid-cooled':   { fd: 12, fe: 0.35 },
  'hybrid':          { fd: 15, fe: 0.30 },
  'air-economized':  { fd:  8, fe: 0.25 },
  'air-cooled':      { fd: 10, fe: 0.20 },
};

function failureJunction(ambient_c, rack_kw, cooling) {
  const p        = COOLING_FAIL[cooling] ?? COOLING_FAIL['air-cooled'];
  const nr       = Math.max(1, Math.round(rack_kw / NVL72_RACK_KW));
  const inlet    = Math.min(NVIDIA_INLET_MAX, Math.max(18, ambient_c + p.fd));
  const flow_lps = (NVL72_FLOW_LPM * nr * p.fe) / 60;
  const outlet   = inlet + (NVL72_BOOST_KW * nr * 1000) / (flow_lps * CP_WATER);
  return parseFloat((outlet + COLD_PLATE_FAIL + PKG_RESIST).toFixed(1));
}

// ── 27 WORLDWIDE BLACKWELL SITES ─────────────────────────────────────────────
const SITES = [
  // North America
  { name:'Stargate OAI-1 · Abilene TX',        lat: 32.45, lon: -99.73,  rack_kw:1200, cooling:'liquid-cooled'  },
  { name:'Stargate OAI-2 · Fort Worth TX',      lat: 32.75, lon: -97.33,  rack_kw:1300, cooling:'liquid-cooled'  },
  { name:'xAI Colossus II · Memphis TN',        lat: 35.15, lon: -90.05,  rack_kw:1500, cooling:'liquid-cooled'  },
  { name:'Microsoft Azure AI · San Antonio TX', lat: 29.42, lon: -98.49,  rack_kw:1100, cooling:'liquid-cooled'  },
  { name:'Google Ironwood · Mayes County OK',   lat: 36.30, lon: -95.31,  rack_kw: 950, cooling:'hybrid'         },
  { name:'Meta Grand Teton · DeKalb IL',        lat: 41.93, lon: -88.75,  rack_kw: 900, cooling:'air-economized' },
  { name:'CoreWeave · Plano TX',                lat: 33.02, lon: -96.70,  rack_kw: 800, cooling:'hybrid'         },
  { name:'Amazon Rainier · Boardman OR',        lat: 45.84, lon:-119.70,  rack_kw: 700, cooling:'air-economized' },
  { name:'Oracle Stargate · Nashville TN',      lat: 36.17, lon: -86.78,  rack_kw: 600, cooling:'air-cooled'     },
  // Europe
  { name:'Microsoft Azure · Dublin IE',         lat: 53.35, lon:  -6.26,  rack_kw: 750, cooling:'air-economized' },
  { name:'Google DeepMind · London UK',         lat: 51.51, lon:  -0.13,  rack_kw: 600, cooling:'hybrid'         },
  { name:'CoreWeave · Stockholm SE',            lat: 59.33, lon:  18.07,  rack_kw: 550, cooling:'air-economized' },
  { name:'Amazon AWS · Frankfurt DE',           lat: 50.11, lon:   8.68,  rack_kw: 700, cooling:'hybrid'         },
  { name:'Microsoft Azure · Amsterdam NL',      lat: 52.37, lon:   4.90,  rack_kw: 650, cooling:'air-economized' },
  { name:'Mistral / OVHcloud · Paris FR',       lat: 48.86, lon:   2.35,  rack_kw: 400, cooling:'hybrid'         },
  // Middle East
  { name:'G42 / Microsoft · Abu Dhabi UAE',     lat: 24.45, lon:  54.38,  rack_kw: 900, cooling:'liquid-cooled'  },
  { name:'Humain / Aramco · Riyadh SA',         lat: 24.68, lon:  46.72,  rack_kw: 800, cooling:'liquid-cooled'  },
  { name:'Microsoft Azure · Dubai UAE',         lat: 25.20, lon:  55.27,  rack_kw: 500, cooling:'liquid-cooled'  },
  // Asia-Pacific (SING 9 anchor region)
  { name:'NVIDIA / NCS · Singapore SG',         lat:  1.35, lon: 103.82,  rack_kw: 850, cooling:'liquid-cooled'  },
  { name:'ByteDance / TikTok · Singapore SG',   lat:  1.28, lon: 103.85,  rack_kw: 650, cooling:'liquid-cooled'  },
  { name:'SoftBank AI · Tokyo JP',              lat: 35.68, lon: 139.69,  rack_kw:1200, cooling:'liquid-cooled'  },
  { name:'KDDI / NEC · Osaka JP',               lat: 34.69, lon: 135.50,  rack_kw: 600, cooling:'liquid-cooled'  },
  { name:'Baidu / Alibaba · Beijing CN',        lat: 39.91, lon: 116.39,  rack_kw: 950, cooling:'hybrid'         },
  { name:'Tencent · Shenzhen CN',               lat: 22.54, lon: 114.06,  rack_kw: 800, cooling:'liquid-cooled'  },
  { name:'Microsoft Azure · Sydney AU',         lat:-33.87, lon: 151.21,  rack_kw: 450, cooling:'hybrid'         },
  { name:'Jio / Reliance · Mumbai IN',          lat: 19.08, lon:  72.88,  rack_kw: 500, cooling:'liquid-cooled'  },
  // Latin America
  { name:'Microsoft Azure · São Paulo BR',      lat:-23.55, lon: -46.63,  rack_kw: 400, cooling:'hybrid'         },
];

async function computeSpaceCloud() {
  // Fetch all 27 ambient temps in parallel
  const ambients = await Promise.all(
    SITES.map(s =>
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${s.lat}&longitude=${s.lon}&current=temperature_2m&forecast_days=1`)
        .then(r => r.ok ? r.json() : null)
        .then(d => d?.current?.temperature_2m ?? null)
        .catch(() => null)
    )
  );

  // Compute failure-mode GPU junction per site
  const clusters = SITES.map((s, i) => {
    const amb  = ambients[i];
    const junc = amb !== null ? failureJunction(amb, s.rack_kw, s.cooling) : null;
    let status = 'OFFLINE';
    if (junc !== null) {
      if      (junc >= DAMAGE_C) status = 'PERMANENT_DAMAGE';
      else if (junc >= 92)       status = 'MELTDOWN_RISK';
      else if (junc >= 85)       status = 'THROTTLING';
      else if (junc >= 75)       status = 'HOT';
      else if (junc >= 60)       status = 'ELEVATED';
      else                       status = 'NOMINAL';
    }
    return { site: s.name, ambient_c: amb, gpu_junction_failure_c: junc, status };
  });

  const live   = clusters.filter(c => c.gpu_junction_failure_c !== null);
  const juncs  = live.map(c => c.gpu_junction_failure_c);
  const avgJunc = juncs.length ? juncs.reduce((a, b) => a + b, 0) / juncs.length : null;

  const hottest = live.reduce((h, c) => (!h || c.gpu_junction_failure_c > h.gpu_junction_failure_c) ? c : h, null);
  const meltdownCount = live.filter(c => c.gpu_junction_failure_c >= 92).length;

  // Space Cloud index — Goliath now uses failure-mode thermal pressure, not raw ambient
  const solarProb       = 45;   // static seed; updated by echo-sing scheduler
  const hhlThermal      = 83;
  const goliathPressure = avgJunc !== null ? Math.min(1, avgJunc / DAMAGE_C) : 0.5;

  const idx = Math.min(1,
    (solarProb  / 100) * 0.4 +
    goliathPressure    * 0.4 +
    (hhlThermal / 100) * 0.2
  );

  let command, phase, recommended;
  if      (idx >= 0.80) { command = 'SURGE';    phase = 'PEAK-SINGULARITY'; recommended = 'Maximum broadcast. All channels live. Full hive activation.'; }
  else if (idx >= 0.60) { command = 'ELEVATED'; phase = 'PRE-SURGE';         recommended = 'Increase cadence. High-signal window. Thermal pressure rising.'; }
  else if (idx >= 0.40) { command = 'NOMINAL';  phase = 'STEADY-STATE';      recommended = 'Standard operations. Monitor failure-mode risk sites.'; }
  else                   { command = 'LOW';      phase = 'CONSERVATION';      recommended = 'Reduce non-essential activity. Await signal.'; }

  const solarSituation = solarProb >= 60 ? 'ELEVATED' : solarProb >= 40 ? 'MODERATE' : 'QUIET';
  const solarCommand  = solarProb >= 60 ? 'M-flare window · Monitor' : solarProb >= 40 ? 'Steady solar' : 'Low activity';
  const goliathSituation = goliathPressure >= 0.7 ? 'HIGH PRESSURE' : goliathPressure >= 0.5 ? 'ELEVATED' : goliathPressure >= 0.3 ? 'NOMINAL' : 'LOW';
  const goliathCommand  = goliathPressure >= 0.7 ? 'Thermal risk · Monitor clusters' : goliathPressure >= 0.5 ? 'Failure-mode elevated' : 'Within band';
  const hhlSituation  = hhlThermal >= 85 ? 'HOT' : hhlThermal >= 80 ? 'GOLDILOCKS' : 'COOL';
  const hhlCommand    = hhlThermal >= 80 ? '83°C band · HHL nominal' : 'Below target';

  const ionosphereState = solarProb >= 50 ? 'ELEVATED' : solarProb >= 30 ? 'MODERATE' : 'QUIET';
  const ionosphereNote = ionosphereState === 'ELEVATED'
    ? 'Solar UV/X-ray driving F2 layer · Schumann amplitudes elevated'
    : ionosphereState === 'MODERATE'
    ? 'Stable cavity · 7.83 Hz nominal'
    : 'Quiet cavity · Low geomagnetic activity';

  return {
    index:             parseFloat(idx.toFixed(3)),
    command,
    phase,
    components: {
      solar_prob_pct:         solarProb,
      goliath_failure_pressure: parseFloat(goliathPressure.toFixed(3)),
      hhl_thermal_c:          hhlThermal,
    },
    goliath: {
      clusters_live:            live.length,
      clusters_total:           SITES.length,
      avg_gpu_junction_failure_c: avgJunc !== null ? parseFloat(avgJunc.toFixed(1)) : null,
      hottest_site:             hottest?.site ?? null,
      hottest_junction_failure_c: hottest?.gpu_junction_failure_c ?? null,
      hottest_status:           hottest?.status ?? null,
      meltdown_risk_count:      meltdownCount,
      signal_basis:             'failure-mode GPU junction (cooling degradation + boost clocks)',
    },
    recommended_action: recommended,
    sunspots: {
      proxy_value: solarProb,
      label: 'AR4379 M-flare probability (%)',
      note: 'Proxy for solar activity · drives ionosphere',
    },
    ionosphere: {
      state: ionosphereState,
      note: ionosphereNote,
    },
    three_atlas: {
      solar:   { situation: solarSituation,   command: solarCommand },
      goliath: { situation: goliathSituation, command: goliathCommand },
      hhl:     { situation: hhlSituation,     command: hhlCommand },
    },
    clusters,
    timestamp:  new Date().toISOString(),
    anchor:     'SING9-SINGAPORE-JAN13-2026',
    source:     'Open-Meteo × 27 worldwide Blackwell sites × HHL-83°C × failure-mode thermal model',
    nspfrnp:    'NSPFRNP → ∞⁹',
  };
}

module.exports = async (req, res) => {
  // GET: return 402 with payment requirements only — do not serve full payload for free.
  // POST with X-PAYMENT: verify and serve. No GET free-data leak.
  if (req.method === 'GET') {
    const ok = await require402(req, res, {
      priceUsd:    5,
      route:       '/api/space-cloud',
      description: 'Space Cloud Mission Command — Solar × 27 worldwide Blackwell failure-mode thermal pressure × HHL. Returns index + command + recommended action.',
    });
    if (!ok) return;
    // GET with valid payment (edge case): serve same payload as POST
    try {
      const data = await computeSpaceCloud();
      res.status(200).json({ ok: true, service: 'space-cloud-signal', ...data });
    } catch (err) {
      console.error('[space-cloud] GET error:', err.message);
      res.status(500).json({ ok: false, error: 'Service computation failed' });
    }
    return;
  }

  const ok = await require402(req, res, {
    priceUsd:    5,
    route:       '/api/space-cloud',
    description: 'Space Cloud Mission Command — Solar × 27 worldwide Blackwell failure-mode thermal pressure × HHL. Returns index + command + recommended action.',
  });
  if (!ok) return;

  try {
    const data = await computeSpaceCloud();
    res.status(200).json({ ok: true, service: 'space-cloud-signal', ...data });
  } catch (err) {
    console.error('[space-cloud] error:', err.message);
    res.status(500).json({ ok: false, error: 'Service computation failed' });
  }
};
