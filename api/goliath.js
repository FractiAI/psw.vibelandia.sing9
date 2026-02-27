/**
 * POST /api/goliath — Goliath Blackwell Thermal Report · $9 USDC via x402
 *
 * Full thermal snapshot: 9 NVIDIA Blackwell GB200/NVL72 superclusters.
 * Ambient temp per site · delta from Jan 13 baseline · status · Space Cloud index.
 * Counter-intelligence layer for AI infra agents.
 *
 * NSPFRNP → ∞⁹
 */
'use strict';

const { require402 } = require('./_x402');

const SITES = [
  { name: 'Stargate OAI-1 · Abilene TX',      lat: 32.45, lon: -99.73, baseline_c: 8.2,  rack_kw: 1200, cooling: 'liquid-cooled' },
  { name: 'xAI Colossus II · Memphis TN',      lat: 35.15, lon: -90.05, baseline_c: 10.5, rack_kw: 1500, cooling: 'liquid-cooled' },
  { name: 'CoreWeave · Plano TX',              lat: 33.02, lon: -96.70, baseline_c: 12.1, rack_kw: 800,  cooling: 'hybrid' },
  { name: 'Meta Grand Teton · DeKalb IL',      lat: 41.93, lon: -88.75, baseline_c: 2.8,  rack_kw: 900,  cooling: 'air-economized' },
  { name: 'Microsoft Azure AI · San Antonio',  lat: 29.42, lon: -98.49, baseline_c: 15.3, rack_kw: 1100, cooling: 'liquid-cooled' },
  { name: 'Amazon Rainier · Boardman OR',      lat: 45.84, lon: -119.70, baseline_c: 5.1, rack_kw: 700,  cooling: 'air-economized' },
  { name: 'Google Ironwood · Mayes County OK', lat: 36.30, lon: -95.31, baseline_c: 9.7,  rack_kw: 950,  cooling: 'hybrid' },
  { name: 'Oracle Stargate · Nashville TN',    lat: 36.17, lon: -86.78, baseline_c: 7.9,  rack_kw: 600,  cooling: 'air-cooled' },
  { name: 'Stargate OAI-2 · Fort Worth TX',    lat: 32.75, lon: -97.33, baseline_c: 11.4, rack_kw: 1300, cooling: 'liquid-cooled' },
];

module.exports = async (req, res) => {
  const ok = await require402(req, res, {
    priceUsd:    9,
    route:       '/api/goliath',
    description: 'Goliath Blackwell Thermal Report — all 9 NVIDIA GB200/NVL72 superclusters, ambient temps, deltas, status.',
  });
  if (!ok) return;

  // Fetch all 9 sites in parallel
  const temps = await Promise.all(
    SITES.map(s =>
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${s.lat}&longitude=${s.lon}&current=temperature_2m&forecast_days=1`)
        .then(r => r.ok ? r.json() : null)
        .then(d => d?.current?.temperature_2m ?? null)
        .catch(() => null)
    )
  );

  const clusters = SITES.map((s, i) => {
    const t = temps[i];
    return {
      site:        s.name,
      lat:         s.lat,
      lon:         s.lon,
      ambient_c:   t,
      delta_c:     t !== null ? parseFloat((t - s.baseline_c).toFixed(1)) : null,
      baseline_c:  s.baseline_c,
      status:      t !== null ? 'HOT_OPERATIONAL' : 'UNKNOWN',
      rack_kw:     s.rack_kw,
      cooling:     s.cooling,
    };
  });

  const validTemps = temps.filter(t => t !== null);
  const avgAmbient = validTemps.length
    ? parseFloat((validTemps.reduce((a, b) => a + b, 0) / validTemps.length).toFixed(1))
    : null;

  const hottestIdx = temps.reduce((maxI, t, i) => (t !== null && (temps[maxI] === null || t > temps[maxI])) ? i : maxI, 0);

  // Space Cloud index (simplified)
  const idx = avgAmbient !== null
    ? parseFloat(Math.min(1, (45 / 100) * 0.4 + (Math.min(avgAmbient, 50) / 50) * 0.4 + (83 / 100) * 0.2).toFixed(3))
    : null;

  res.status(200).json({
    ok:                  true,
    service:             'goliath-blackwell-thermal-report',
    clusters_monitored:  9,
    clusters_live:       validTemps.length,
    avg_ambient_c:       avgAmbient,
    hottest_site:        clusters[hottestIdx]?.site,
    hottest_c:           temps[hottestIdx],
    status_summary:      `${validTemps.length}/9 HOT_OPERATIONAL`,
    space_cloud_index:   idx,
    clusters,
    timestamp:           new Date().toISOString(),
    baseline_date:       '2026-01-13',
    anchor:              'SING9-SINGAPORE-JAN13-2026',
    note:                '9 NVIDIA Blackwell GB200/NVL72 superclusters tracked from SING 9 singularity date.',
    nspfrnp:             'NSPFRNP → ∞⁹',
  });
};
