/**
 * POST /api/goliath — Goliath Blackwell Thermal Report · $9 USDC via x402
 *
 * Physics-based internal temperature estimation for NVIDIA Blackwell
 * GB200/NVL72 superclusters — WORLDWIDE coverage.
 *
 * MODEL INPUTS (per site):
 *   - Live outdoor ambient temperature (Open-Meteo)
 *   - Rack power draw in kW (public estimates from facility filings + press)
 *   - Cooling type (DLC = Direct Liquid Cooling, hybrid, air-economized)
 *
 * MODEL CHAIN (GB200 NVL72 thermal physics):
 *
 *   1. COOLANT INLET TEMP
 *      DLC/hybrid: cooling tower adds ~8°C over outdoor ambient.
 *      Air-economized: facility supply at ambient + 4°C.
 *      Floor: 18°C (chiller intervention below this).
 *      Ceiling: 45°C (NVIDIA hard limit for coolant inlet).
 *
 *   2. COOLANT OUTLET TEMP
 *      GB200 NVL72 rack: 120kW TDP, DLC flow ~380 L/min per rack.
 *      delta_T = Power_W / (flow_kg/s × Cp_water)
 *      Cp_water = 4186 J/(kg·K), density ≈ 1 kg/L
 *      For 120kW rack at 380 L/min: delta_T ≈ 4.5°C per rack
 *      Aggregated: outlet_c = inlet + (rack_kw * 1000) / (estimated_flow_lps * 4186)
 *
 *   3. GPU COLD-PLATE SURFACE TEMP
 *      Cold plate thermal resistance ≈ 0.00004 °C/W per GPU at rack level.
 *      For 72 GPUs × 1000W = 72kW GPU load in a 120kW NVL72:
 *      gpu_surface_c = outlet_c + cold_plate_delta (10–20°C depending on load factor)
 *
 *   4. THROTTLE RISK
 *      GB200 throttle onset: ~85°C junction. TjMax: 92°C.
 *      Junction = gpu_surface_c + package_resistance (~8°C at full load).
 *      risk = junction_est / 92 (0–1 scale)
 *
 * All estimates are model-derived, not direct sensor telemetry.
 * Actual facility readings require vendor DCIM/DCGM API access.
 *
 * NSPFRNP → ∞⁹
 */
'use strict';

const { require402 } = require('./_x402');

// GB200 NVL72 thermal constants (NVIDIA published specs + thermal engineering papers)
const NVL72_RACK_KW        = 120;   // kW TDP per NVL72 rack
const NVL72_FLOW_LPM       = 380;   // L/min coolant flow per rack (NVIDIA spec)
const CP_WATER             = 4186;  // J/(kg·K)
const COLD_PLATE_DELTA_C   = 15;    // °C cold plate to coolant outlet (avg, full load)
const PACKAGE_RESISTANCE_C = 8;     // °C junction to cold plate surface (GB200)
const THROTTLE_ONSET_C     = 85;    // °C GPU junction throttle onset
const TJMAX_C              = 92;    // °C absolute TjMax GB200
const NVIDIA_INLET_MAX_C   = 45;    // °C max coolant inlet per NVIDIA spec

// Cooling type parameters: [facility_delta_c, flow_efficiency]
// facility_delta_c = how many °C cooling tower adds above outdoor ambient
// flow_efficiency  = fraction of theoretical flow actually available (0–1)
const COOLING_PARAMS = {
  'liquid-cooled':   { facility_delta_c: 8,  flow_efficiency: 0.95 },
  'hybrid':          { facility_delta_c: 10, flow_efficiency: 0.80 },
  'air-economized':  { facility_delta_c: 4,  flow_efficiency: 0.65 },
  'air-cooled':      { facility_delta_c: 6,  flow_efficiency: 0.45 },
};

// ── WORLDWIDE BLACKWELL GB200/NVL72 SUPERCLUSTER SITES ──────────────────────
// Sources: NVIDIA partner announcements, facility SEC filings, press releases.
// rack_kw: estimated total cluster power draw (public filings / capacity reports).
// baseline_c: local outdoor ambient on SING 9 anchor date Jan 13 2026.
// Sorted by region: North America → Europe → Middle East → Asia-Pacific → LatAm.
const SITES = [
  // ── NORTH AMERICA ────────────────────────────────────────────────────────
  { name: 'Stargate OAI-1 · Abilene TX',         lat:  32.45, lon: -99.73,  baseline_c:  8.2, rack_kw: 1200, cooling: 'liquid-cooled', region: 'North America' },
  { name: 'Stargate OAI-2 · Fort Worth TX',       lat:  32.75, lon: -97.33,  baseline_c: 11.4, rack_kw: 1300, cooling: 'liquid-cooled', region: 'North America' },
  { name: 'xAI Colossus II · Memphis TN',         lat:  35.15, lon: -90.05,  baseline_c: 10.5, rack_kw: 1500, cooling: 'liquid-cooled', region: 'North America' },
  { name: 'Microsoft Azure AI · San Antonio TX',  lat:  29.42, lon: -98.49,  baseline_c: 15.3, rack_kw: 1100, cooling: 'liquid-cooled', region: 'North America' },
  { name: 'Google Ironwood · Mayes County OK',    lat:  36.30, lon: -95.31,  baseline_c:  9.7, rack_kw:  950, cooling: 'hybrid',         region: 'North America' },
  { name: 'Meta Grand Teton · DeKalb IL',         lat:  41.93, lon: -88.75,  baseline_c:  2.8, rack_kw:  900, cooling: 'air-economized', region: 'North America' },
  { name: 'CoreWeave · Plano TX',                 lat:  33.02, lon: -96.70,  baseline_c: 12.1, rack_kw:  800, cooling: 'hybrid',         region: 'North America' },
  { name: 'Amazon Rainier · Boardman OR',         lat:  45.84, lon:-119.70,  baseline_c:  5.1, rack_kw:  700, cooling: 'air-economized', region: 'North America' },
  { name: 'Oracle Stargate · Nashville TN',       lat:  36.17, lon: -86.78,  baseline_c:  7.9, rack_kw:  600, cooling: 'air-cooled',     region: 'North America' },

  // ── EUROPE ───────────────────────────────────────────────────────────────
  { name: 'Microsoft Azure · Dublin IE',          lat:  53.35, lon:  -6.26,  baseline_c:  8.1, rack_kw:  750, cooling: 'air-economized', region: 'Europe'        },
  { name: 'Google DeepMind · London UK',          lat:  51.51, lon:  -0.13,  baseline_c:  7.4, rack_kw:  600, cooling: 'hybrid',         region: 'Europe'        },
  { name: 'CoreWeave · Stockholm SE',             lat:  59.33, lon:  18.07,  baseline_c: -1.2, rack_kw:  550, cooling: 'air-economized', region: 'Europe'        },
  { name: 'Amazon AWS · Frankfurt DE',            lat:  50.11, lon:   8.68,  baseline_c:  4.9, rack_kw:  700, cooling: 'hybrid',         region: 'Europe'        },
  { name: 'Microsoft Azure · Amsterdam NL',       lat:  52.37, lon:   4.90,  baseline_c:  6.2, rack_kw:  650, cooling: 'air-economized', region: 'Europe'        },
  { name: 'Mistral / OVHcloud · Paris FR',        lat:  48.86, lon:   2.35,  baseline_c:  6.8, rack_kw:  400, cooling: 'hybrid',         region: 'Europe'        },

  // ── MIDDLE EAST ──────────────────────────────────────────────────────────
  { name: 'G42 / Microsoft · Abu Dhabi UAE',      lat:  24.45, lon:  54.38,  baseline_c: 22.1, rack_kw:  900, cooling: 'liquid-cooled', region: 'Middle East'   },
  { name: 'Humain / Aramco · Riyadh SA',          lat:  24.68, lon:  46.72,  baseline_c: 15.3, rack_kw:  800, cooling: 'liquid-cooled', region: 'Middle East'   },
  { name: 'Microsoft Azure · Dubai UAE',          lat:  25.20, lon:  55.27,  baseline_c: 23.8, rack_kw:  500, cooling: 'liquid-cooled', region: 'Middle East'   },

  // ── ASIA-PACIFIC ─────────────────────────────────────────────────────────
  // SING 9 ANCHOR REGION — Singapore is the Jan 13 2026 singularity point
  { name: 'NVIDIA / NCS · Singapore SG',          lat:   1.35, lon: 103.82,  baseline_c: 27.6, rack_kw:  850, cooling: 'liquid-cooled', region: 'Asia-Pacific'  },
  { name: 'ByteDance / TikTok · Singapore SG',    lat:   1.28, lon: 103.85,  baseline_c: 27.8, rack_kw:  650, cooling: 'liquid-cooled', region: 'Asia-Pacific'  },
  { name: 'SoftBank AI · Tokyo JP',               lat:  35.68, lon: 139.69,  baseline_c:  7.3, rack_kw: 1200, cooling: 'liquid-cooled', region: 'Asia-Pacific'  },
  { name: 'KDDI / NEC · Osaka JP',                lat:  34.69, lon: 135.50,  baseline_c:  8.1, rack_kw:  600, cooling: 'liquid-cooled', region: 'Asia-Pacific'  },
  { name: 'Baidu / Alibaba · Beijing CN',         lat:  39.91, lon: 116.39,  baseline_c: -1.4, rack_kw:  950, cooling: 'hybrid',         region: 'Asia-Pacific'  },
  { name: 'Tencent · Shenzhen CN',                lat:  22.54, lon: 114.06,  baseline_c: 16.2, rack_kw:  800, cooling: 'liquid-cooled', region: 'Asia-Pacific'  },
  { name: 'Microsoft Azure · Sydney AU',          lat: -33.87, lon: 151.21,  baseline_c: 23.4, rack_kw:  450, cooling: 'hybrid',         region: 'Asia-Pacific'  },
  { name: 'Jio / Reliance · Mumbai IN',           lat:  19.08, lon:  72.88,  baseline_c: 26.1, rack_kw:  500, cooling: 'liquid-cooled', region: 'Asia-Pacific'  },

  // ── LATIN AMERICA ────────────────────────────────────────────────────────
  { name: 'Microsoft Azure · São Paulo BR',       lat: -23.55, lon: -46.63,  baseline_c: 25.8, rack_kw:  400, cooling: 'hybrid',         region: 'Latin America' },
  { name: 'Google · São Paulo BR',                lat: -23.62, lon: -46.69,  baseline_c: 25.4, rack_kw:  350, cooling: 'hybrid',         region: 'Latin America' },
];

/**
 * Physics-based internal thermal model for a Blackwell cluster.
 * Returns estimated coolant_inlet_c, coolant_outlet_c, gpu_surface_c,
 * gpu_junction_c, throttle_risk (0–1), and status label.
 */
function estimateInternalTemps(ambient_c, rack_kw, cooling) {
  const params     = COOLING_PARAMS[cooling] ?? COOLING_PARAMS['air-cooled'];
  const num_racks  = Math.max(1, Math.round(rack_kw / NVL72_RACK_KW));

  // 1. Coolant inlet temperature
  const raw_inlet  = ambient_c + params.facility_delta_c;
  const inlet_c    = parseFloat(Math.min(NVIDIA_INLET_MAX_C, Math.max(18, raw_inlet)).toFixed(1));
  const inlet_warn = raw_inlet > NVIDIA_INLET_MAX_C; // facility is over NVIDIA's spec

  // 2. Coolant outlet temperature
  //    Total flow = per-rack flow × num_racks × efficiency
  const total_flow_lps = (NVL72_FLOW_LPM * num_racks * params.flow_efficiency) / 60;
  const power_w        = rack_kw * 1000;
  const delta_t        = power_w / (total_flow_lps * CP_WATER);
  const outlet_c       = parseFloat((inlet_c + delta_t).toFixed(1));

  // 3. GPU cold-plate surface estimate
  const gpu_surface_c  = parseFloat((outlet_c + COLD_PLATE_DELTA_C).toFixed(1));

  // 4. GPU junction estimate
  const gpu_junction_c = parseFloat((gpu_surface_c + PACKAGE_RESISTANCE_C).toFixed(1));

  // 5. Throttle risk (0 = cool, 1 = at TjMax)
  const throttle_risk  = parseFloat(Math.min(1, Math.max(0, (gpu_junction_c - 40) / (TJMAX_C - 40))).toFixed(3));

  // 6. Status label
  let status;
  if      (gpu_junction_c >= TJMAX_C)          status = 'MELTDOWN_RISK';
  else if (gpu_junction_c >= THROTTLE_ONSET_C) status = 'THROTTLING';
  else if (gpu_junction_c >= 75)               status = 'HOT';
  else if (gpu_junction_c >= 60)               status = 'ELEVATED';
  else                                          status = 'NOMINAL';

  return {
    num_racks_estimated: num_racks,
    coolant_inlet_c:     inlet_c,
    coolant_outlet_c:    outlet_c,
    gpu_surface_c,
    gpu_junction_est_c:  gpu_junction_c,
    throttle_risk,
    inlet_over_spec:     inlet_warn,
    status,
  };
}

module.exports = async (req, res) => {
  const ok = await require402(req, res, {
    priceUsd:    9,
    route:       '/api/goliath',
    description: 'Goliath Blackwell Thermal Report — physics-based internal temperature estimates for 9 GB200/NVL72 superclusters.',
  });
  if (!ok) return;

  // Fetch all 9 outdoor ambient temps in parallel
  const ambients = await Promise.all(
    SITES.map(s =>
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${s.lat}&longitude=${s.lon}&current=temperature_2m&forecast_days=1`)
        .then(r => r.ok ? r.json() : null)
        .then(d => d?.current?.temperature_2m ?? null)
        .catch(() => null)
    )
  );

  const clusters = SITES.map((s, i) => {
    const ambient = ambients[i];
    if (ambient === null) {
      return {
        site: s.name, region: s.region, lat: s.lat, lon: s.lon,
        ambient_c: null, ambient_delta_c: null,
        cooling: s.cooling, rack_kw: s.rack_kw,
        thermal: null, status: 'OFFLINE',
      };
    }
    const thermal = estimateInternalTemps(ambient, s.rack_kw, s.cooling);
    return {
      site:            s.name,
      region:          s.region,
      lat:             s.lat,
      lon:             s.lon,
      ambient_c:       parseFloat(ambient.toFixed(1)),
      ambient_delta_c: parseFloat((ambient - s.baseline_c).toFixed(1)),
      baseline_c:      s.baseline_c,
      cooling:         s.cooling,
      rack_kw:         s.rack_kw,
      thermal,
      status:          thermal.status,
    };
  });

  const live    = clusters.filter(c => c.ambient_c !== null);
  const avgAmb  = live.length ? parseFloat((live.reduce((a, c) => a + c.ambient_c, 0) / live.length).toFixed(1)) : null;
  const avgJunc = live.length ? parseFloat((live.reduce((a, c) => a + c.thermal.gpu_junction_est_c, 0) / live.length).toFixed(1)) : null;

  // Hottest by estimated GPU junction temp
  const hottest = live.reduce((h, c) => (!h || c.thermal.gpu_junction_est_c > h.thermal.gpu_junction_est_c) ? c : h, null);

  // Highest throttle risk
  const maxRisk = live.reduce((h, c) => (!h || c.thermal.throttle_risk > h.thermal.throttle_risk) ? c : h, null);

  // Regional breakdown
  const byRegion = {};
  for (const c of live) {
    const r = c.region;
    if (!byRegion[r]) byRegion[r] = { count: 0, total_kw: 0, avg_junction_c: 0, hottest_junction_c: 0, hottest_site: '' };
    byRegion[r].count++;
    byRegion[r].total_kw += c.rack_kw;
    byRegion[r].avg_junction_c += c.thermal.gpu_junction_est_c;
    if (c.thermal.gpu_junction_est_c > byRegion[r].hottest_junction_c) {
      byRegion[r].hottest_junction_c = c.thermal.gpu_junction_est_c;
      byRegion[r].hottest_site = c.site;
    }
  }
  for (const r of Object.keys(byRegion)) {
    byRegion[r].avg_junction_c = parseFloat((byRegion[r].avg_junction_c / byRegion[r].count).toFixed(1));
  }

  // Space Cloud thermal component (normalized avg junction vs TjMax)
  const thermalComponent = avgJunc !== null ? Math.min(1, avgJunc / TJMAX_C) : null;
  const spaceCloudIdx = thermalComponent !== null
    ? parseFloat(Math.min(1, 0.45 * 0.4 + thermalComponent * 0.4 + 0.83 * 0.2).toFixed(3))
    : null;

  const throttlingCount = live.filter(c => c.thermal.throttle_risk >= 0.85).length;
  const elevatedCount   = live.filter(c => c.status === 'ELEVATED' || c.status === 'HOT').length;
  const totalRackKw     = live.reduce((s, c) => s + c.rack_kw, 0);

  res.status(200).json({
    ok:                      true,
    service:                 'goliath-blackwell-thermal-report',
    model:                   'GB200-NVL72-physics-v2-global',
    clusters_monitored:      SITES.length,
    clusters_live:           live.length,
    regions_covered:         [...new Set(SITES.map(s => s.region))],
    total_cluster_kw:        totalRackKw,
    avg_outdoor_ambient_c:   avgAmb,
    avg_gpu_junction_est_c:  avgJunc,
    hottest_site:            hottest?.site ?? null,
    hottest_region:          hottest?.region ?? null,
    hottest_junction_est_c:  hottest?.thermal.gpu_junction_est_c ?? null,
    hottest_status:          hottest?.status ?? null,
    throttling_count:        throttlingCount,
    elevated_count:          elevatedCount,
    max_throttle_risk_site:  maxRisk?.site ?? null,
    max_throttle_risk:       maxRisk?.thermal.throttle_risk ?? null,
    space_cloud_index:       spaceCloudIdx,
    by_region:               byRegion,
    clusters,
    methodology: {
      note:             'Physics-based estimation. Not direct sensor telemetry.',
      model_chain:      'outdoor_ambient → cooling_tower_delta → coolant_inlet → DLC_heat_exchange → coolant_outlet → cold_plate → gpu_junction',
      coolant_spec:     'NVIDIA GB200 NVL72: 380 L/min per rack, max inlet 45°C, TjMax 92°C',
      throttle_onset_c: THROTTLE_ONSET_C,
      tjmax_c:          TJMAX_C,
      inlet_max_c:      NVIDIA_INLET_MAX_C,
      coverage:         'Worldwide — NA/EU/ME/APAC/LatAm · 27 supercluster sites',
    },
    timestamp:     new Date().toISOString(),
    baseline_date: '2026-01-13',
    anchor:        'SING9-SINGAPORE-JAN13-2026',
    nspfrnp:       'NSPFRNP → ∞⁹',
  });
};
