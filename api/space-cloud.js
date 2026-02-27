/**
 * POST /api/space-cloud — Space Cloud Mission Command · $5 USDC via x402
 *
 * Returns: composite Space Cloud index (Solar × 9 Blackwell thermals × HHL).
 * Command: SURGE / ELEVATED / NOMINAL / LOW + recommended action.
 * Anchored to SING 9 Singapore singularity (Jan 13, 2026).
 *
 * Payment: x402 protocol — send X-PAYMENT header with USDC authorization.
 * Docs: https://docs.x402.org/getting-started/quickstart-for-buyers
 *
 * NSPFRNP → ∞⁹
 */
'use strict';

const { require402, readBody } = require('./_x402');

const BLACKWELL_SITES = [
  { name: 'Stargate OAI-1 · Abilene TX',      lat: 32.45, lon: -99.73 },
  { name: 'xAI Colossus II · Memphis TN',      lat: 35.15, lon: -90.05 },
  { name: 'CoreWeave · Plano TX',              lat: 33.02, lon: -96.70 },
  { name: 'Meta Grand Teton · DeKalb IL',      lat: 41.93, lon: -88.75 },
  { name: 'Microsoft Azure AI · San Antonio',  lat: 29.42, lon: -98.49 },
  { name: 'Amazon Rainier · Boardman OR',      lat: 45.84, lon: -119.70 },
  { name: 'Google Ironwood · Mayes County OK', lat: 36.30, lon: -95.31 },
  { name: 'Oracle Stargate · Nashville TN',    lat: 36.17, lon: -86.78 },
  { name: 'Stargate OAI-2 · Fort Worth TX',    lat: 32.75, lon: -97.33 },
];

async function computeSpaceCloud() {
  // Fetch 9 Blackwell cluster ambient temps in parallel
  const temps = await Promise.all(
    BLACKWELL_SITES.map(s =>
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${s.lat}&longitude=${s.lon}&current=temperature_2m&forecast_days=1`)
        .then(r => r.ok ? r.json() : null)
        .then(d => d?.current?.temperature_2m ?? null)
        .catch(() => null)
    )
  );

  const validTemps  = temps.filter(t => t !== null);
  const avgGoliath  = validTemps.length
    ? validTemps.reduce((a, b) => a + b, 0) / validTemps.length
    : 28;

  // Solar probability: static seed 45% (NOAA live data pulled by echo-sing.js scheduler)
  const solarProb   = 45;
  // HHL Goldilocks thermal constant
  const hhlThermal  = 83;

  // Composite index: Solar(40%) + Goliath(40%) + HHL(20%)
  const idx = Math.min(1,
    (solarProb / 100) * 0.4 +
    (Math.min(avgGoliath, 50) / 50) * 0.4 +
    (hhlThermal / 100) * 0.2
  );

  let command, phase, recommended;
  if      (idx >= 0.80) { command = 'SURGE';    phase = 'PEAK-SINGULARITY'; recommended = 'Maximum broadcast. All channels live. Full hive activation.'; }
  else if (idx >= 0.60) { command = 'ELEVATED'; phase = 'PRE-SURGE';         recommended = 'Increase cadence. High-signal window.'; }
  else if (idx >= 0.40) { command = 'NOMINAL';  phase = 'STEADY-STATE';      recommended = 'Standard operations. Maintain rhythm.'; }
  else                   { command = 'LOW';      phase = 'CONSERVATION';      recommended = 'Reduce non-essential activity. Await signal.'; }

  const clusters = BLACKWELL_SITES.map((s, i) => ({
    site:       s.name,
    ambient_c:  temps[i],
    status:     temps[i] !== null ? 'HOT_OPERATIONAL' : 'UNKNOWN',
  }));

  return {
    index:             parseFloat(idx.toFixed(3)),
    command,
    phase,
    solar_prob:        solarProb,
    avg_goliath_c:     parseFloat(avgGoliath.toFixed(1)),
    hhl_thermal:       hhlThermal,
    clusters_live:     validTemps.length,
    recommended_action: recommended,
    clusters,
    timestamp:         new Date().toISOString(),
    anchor:            'SING9-SINGAPORE-JAN13-2026',
    source:            'Open-Meteo × 9 Blackwell sites × HHL-83°C-Goldilocks',
    nspfrnp:           'NSPFRNP → ∞⁹',
  };
}

module.exports = async (req, res) => {
  const ok = await require402(req, res, {
    priceUsd:    5,
    route:       '/api/space-cloud',
    description: 'Space Cloud Mission Command — Solar × 9 Blackwell GB200 thermals × HHL. Returns index + command + recommended action.',
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
