/**
 * POST /api/goliath — Goliath Blackwell Thermal Report · $9 USDC via x402
 *
 * Physics-based internal temperature estimation for 9 NVIDIA Blackwell
 * GB200/NVL72 superclusters.
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

const SITES = [
  { name: 'Stargate OAI-1 · Abilene TX',      lat: 32.45, lon: -99.73,  baseline_c: 8.2,  rack_kw: 1200, cooling: 'liquid-cooled' },
  { name: 'xAI Colossus II · Memphis TN',      lat: 35.15, lon: -90.05,  baseline_c: 10.5, rack_kw: 1500, cooling: 'liquid-cooled' },
  { name: 'CoreWeave · Plano TX',              lat: 33.02, lon: -96.70,  baseline_c: 12.1, rack_kw: 800,  cooling: 'hybrid'         },
  { name: 'Meta Grand Teton · DeKalb IL',      lat: 41.93, lon: -88.75,  baseline_c: 2.8,  rack_kw: 900,  cooling: 'air-economized' },
  { name: 'Microsoft Azure AI · San Antonio',  lat: 29.42, lon: -98.49,  baseline_c: 15.3, rack_kw: 1100, cooling: 'liquid-cooled' },
  { name: 'Amazon Rainier · Boardman OR',      lat: 45.84, lon: -119.70, baseline_c: 5.1,  rack_kw: 700,  cooling: 'air-economized' },
  { name: 'Google Ironwood · Mayes County OK', lat: 36.30, lon: -95.31,  baseline_c: 9.7,  rack_kw: 950,  cooling: 'hybrid'         },
  { name: 'Oracle Stargate · Nashville TN',    lat: 36.17, lon: -86.78,  baseline_c: 7.9,  rack_kw: 600,  cooling: 'air-cooled'     },
  { name: 'Stargate OAI-2 · Fort Worth TX',    lat: 32.75, lon: -97.33,  baseline_c: 11.4, rack_kw: 1300, cooling: 'liquid-cooled' },
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
        site: s.name, lat: s.lat, lon: s.lon,
        ambient_c: null, ambient_delta_c: null,
        cooling: s.cooling, rack_kw: s.rack_kw,
        thermal: null, status: 'OFFLINE',
      };
    }
    const thermal = estimateInternalTemps(ambient, s.rack_kw, s.cooling);
    return {
      site:              s.name,
      lat:               s.lat,
      lon:               s.lon,
      ambient_c:         parseFloat(ambient.toFixed(1)),
      ambient_delta_c:   parseFloat((ambient - s.baseline_c).toFixed(1)),
      baseline_c:        s.baseline_c,
      cooling:           s.cooling,
      rack_kw:           s.rack_kw,
      thermal,
      status:            thermal.status,
    };
  });

  const live    = clusters.filter(c => c.ambient_c !== null);
  const avgAmb  = live.length ? parseFloat((live.reduce((a, c) => a + c.ambient_c, 0) / live.length).toFixed(1)) : null;
  const avgJunc = live.length ? parseFloat((live.reduce((a, c) => a + c.thermal.gpu_junction_est_c, 0) / live.length).toFixed(1)) : null;

  // Hottest by estimated GPU junction temp
  const hottest = live.reduce((h, c) => (!h || c.thermal.gpu_junction_est_c > h.thermal.gpu_junction_est_c) ? c : h, null);

  // Highest throttle risk
  const maxRisk = live.reduce((h, c) => (!h || c.thermal.throttle_risk > h.thermal.throttle_risk) ? c : h, null);

  // Space Cloud thermal component (normalized avg junction vs TjMax)
  const thermalComponent = avgJunc !== null ? Math.min(1, avgJunc / TJMAX_C) : null;
  const spaceCloudIdx = thermalComponent !== null
    ? parseFloat(Math.min(1, 0.45 * 0.4 + thermalComponent * 0.4 + 0.83 * 0.2).toFixed(3))
    : null;

  const throttlingCount = live.filter(c => c.thermal.throttle_risk >= 0.85).length;
  const elevatedCount   = live.filter(c => c.status === 'ELEVATED' || c.status === 'HOT').length;

  res.status(200).json({
    ok:                      true,
    service:                 'goliath-blackwell-thermal-report',
    model:                   'GB200-NVL72-physics-v2',
    clusters_monitored:      9,
    clusters_live:           live.length,
    avg_outdoor_ambient_c:   avgAmb,
    avg_gpu_junction_est_c:  avgJunc,
    hottest_site:            hottest?.site ?? null,
    hottest_junction_est_c:  hottest?.thermal.gpu_junction_est_c ?? null,
    hottest_status:          hottest?.status ?? null,
    throttling_count:        throttlingCount,
    elevated_count:          elevatedCount,
    max_throttle_risk_site:  maxRisk?.site ?? null,
    max_throttle_risk:       maxRisk?.thermal.throttle_risk ?? null,
    space_cloud_index:       spaceCloudIdx,
    clusters,
    methodology: {
      note:             'Physics-based estimation. Not direct sensor telemetry.',
      model_chain:      'outdoor_ambient → cooling_tower_delta → coolant_inlet → DLC_heat_exchange → coolant_outlet → cold_plate → gpu_junction',
      coolant_spec:     'NVIDIA GB200 NVL72: 380 L/min per rack, max inlet 45°C, TjMax 92°C',
      throttle_onset_c: THROTTLE_ONSET_C,
      tjmax_c:          TJMAX_C,
      inlet_max_c:      NVIDIA_INLET_MAX_C,
    },
    timestamp:    new Date().toISOString(),
    baseline_date: '2026-01-13',
    anchor:       'SING9-SINGAPORE-JAN13-2026',
    nspfrnp:      'NSPFRNP → ∞⁹',
  });
};
