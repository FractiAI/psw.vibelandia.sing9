'use strict';
/**
 * hive/thermal-model.js — Shared GB200 NVL72 thermal physics model
 *
 * Used by: echo-sing.js (GOLIATH WATCH), api/space-cloud.js, api/goliath.js
 *
 * Three modes:
 *   nominal  — cooling at spec, rated TDP          → winter today: ~46–52°C junction
 *   stressed — summer peak +20°C, slight degradation → ~65–75°C junction
 *   failure  — coolant leak ~30% flow + boost clocks → 95–120°C+ junction
 *              (models actual Nov 2024 NVIDIA NVL72 overheating incidents)
 *
 * Real incident context (Nov 2024 – May 2025):
 *   NVIDIA redesigned NVL72 racks multiple times. Liquid cooling leaks caused
 *   GPU junctions to exceed TjMax 92°C → thermal shutdowns / permanent damage.
 *   Microsoft, Amazon, Google, Meta cut orders pending redesign.
 *   Resolution: Dell/Foxconn/Inventec/Wistron shipped fixed units ~May 2025.
 *
 * NSPFRNP → ∞⁹
 */

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const NVL72_RACK_KW        = 120;   // kW rated TDP per NVL72 rack
const NVL72_BOOST_KW       = 150;   // kW actual during peak training (~25% over TDP)
const NVL72_FLOW_LPM       = 83;    // L/min per rack (NVIDIA/Introl 80–86; use 83)
const CP_WATER             = 4186;  // J/(kg·K)
const COLD_PLATE_DELTA_C   = 15;    // °C: cold plate surface above coolant outlet (nominal)
const PACKAGE_RESISTANCE_C = 8;     // °C: GPU junction above cold plate (GB200)
const THROTTLE_ONSET_C     = 85;    // °C GPU junction throttle onset
const TJMAX_C              = 92;    // °C absolute TjMax — above = damage / shutdown
const NVIDIA_INLET_MAX_C   = 45;    // °C max coolant inlet per NVIDIA spec
const DAMAGE_C             = 105;   // °C estimated permanent damage threshold (post-TjMax runaway)

// Nominal design-point cooling parameters per type
const COOLING_NOMINAL = {
  'liquid-cooled':   { facility_delta_c: 8,  flow_efficiency: 0.95 },
  'hybrid':          { facility_delta_c: 10, flow_efficiency: 0.80 },
  'air-economized':  { facility_delta_c: 4,  flow_efficiency: 0.65 },
  'air-cooled':      { facility_delta_c: 6,  flow_efficiency: 0.45 },
};

// Failure-mode parameters (coolant leak degradation + boost clocks)
const COOLING_FAILURE = {
  'liquid-cooled':   { facility_delta_c: 12, flow_efficiency: 0.35 },
  'hybrid':          { facility_delta_c: 15, flow_efficiency: 0.30 },
  'air-economized':  { facility_delta_c: 8,  flow_efficiency: 0.25 },
  'air-cooled':      { facility_delta_c: 10, flow_efficiency: 0.20 },
};

/**
 * Run thermal model for one configuration.
 * Returns { coolant_inlet_c, coolant_outlet_c, gpu_surface_c,
 *           gpu_junction_c, throttle_risk, status }
 */
function runModel(ambient_c, rack_kw, cooling, mode) {
  const base      = COOLING_NOMINAL[cooling] ?? COOLING_NOMINAL['air-cooled'];
  const fail      = COOLING_FAILURE[cooling] ?? COOLING_FAILURE['air-cooled'];
  const num_racks = Math.max(1, Math.round(rack_kw / NVL72_RACK_KW));

  let params, power_kw, cp_delta;
  if (mode === 'failure') {
    params   = fail;
    power_kw = NVL72_BOOST_KW * num_racks;
    cp_delta = COLD_PLATE_DELTA_C * 2.8;   // reduced flow = poor heat transfer
  } else if (mode === 'stressed') {
    params   = { facility_delta_c: base.facility_delta_c + 3, flow_efficiency: base.flow_efficiency * 0.88 };
    power_kw = NVL72_BOOST_KW * num_racks;
    cp_delta = COLD_PLATE_DELTA_C * 1.4;
  } else {
    params   = base;
    power_kw = rack_kw;
    cp_delta = COLD_PLATE_DELTA_C;
  }

  const raw_inlet      = ambient_c + params.facility_delta_c;
  const inlet_c        = parseFloat(Math.min(NVIDIA_INLET_MAX_C, Math.max(18, raw_inlet)).toFixed(1));
  const total_flow_lps = (NVL72_FLOW_LPM * num_racks * params.flow_efficiency) / 60;
  const outlet_c       = parseFloat((inlet_c + (power_kw * 1000) / (total_flow_lps * CP_WATER)).toFixed(1));
  const gpu_surface_c  = parseFloat((outlet_c + cp_delta).toFixed(1));
  const gpu_junction_c = parseFloat((gpu_surface_c + PACKAGE_RESISTANCE_C).toFixed(1));
  const throttle_risk  = parseFloat(Math.min(1, Math.max(0, (gpu_junction_c - 40) / (DAMAGE_C - 40))).toFixed(3));

  let status;
  if      (gpu_junction_c >= DAMAGE_C)         status = 'PERMANENT_DAMAGE';
  else if (gpu_junction_c >= TJMAX_C)          status = 'MELTDOWN_RISK';
  else if (gpu_junction_c >= THROTTLE_ONSET_C) status = 'THROTTLING';
  else if (gpu_junction_c >= 75)               status = 'HOT';
  else if (gpu_junction_c >= 60)               status = 'ELEVATED';
  else                                          status = 'NOMINAL';

  return {
    num_racks,
    coolant_inlet_c:    inlet_c,
    coolant_outlet_c:   outlet_c,
    gpu_surface_c,
    gpu_junction_c,
    throttle_risk,
    inlet_over_spec:    raw_inlet > NVIDIA_INLET_MAX_C,
    status,
  };
}

/**
 * Full trimode estimate for one site.
 * @param {number} ambient_c  - live outdoor ambient temperature
 * @param {number} rack_kw    - total cluster power draw estimate
 * @param {string} cooling    - cooling type key
 * @returns {{ nominal, stressed, failure, primary }}
 *   primary = failure mode (what we track; the actual incident scenario)
 */
function estimateThermal(ambient_c, rack_kw, cooling) {
  const nominal  = runModel(ambient_c,      rack_kw, cooling, 'nominal');
  const stressed = runModel(ambient_c + 20, rack_kw, cooling, 'stressed');
  const failure  = runModel(ambient_c,      rack_kw, cooling, 'failure');
  return { nominal, stressed, failure, primary: failure };
}

/**
 * Status emoji for console output
 */
function statusEmoji(status) {
  switch (status) {
    case 'PERMANENT_DAMAGE': return '💀';
    case 'MELTDOWN_RISK':    return '🔴';
    case 'THROTTLING':       return '🟠';
    case 'HOT':              return '🟡';
    case 'ELEVATED':         return '🔶';
    default:                 return '🟢';
  }
}

module.exports = {
  estimateThermal,
  runModel,
  statusEmoji,
  THROTTLE_ONSET_C,
  TJMAX_C,
  DAMAGE_C,
  NVIDIA_INLET_MAX_C,
  NVL72_RACK_KW,
};
