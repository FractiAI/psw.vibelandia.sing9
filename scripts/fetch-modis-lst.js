/**
 * Fetch real surface temperature data for trial-period dates.
 *
 * Sources:
 *   1. Open-Meteo Archive API — ERA5 2m air temp + surface temp proxy
 *   2. ORNL DAAC MODIS web service — MOD11A1 Terra daytime LST
 *   3. Fallback: NASA Earthdata APPEEARS if ORNL unavailable
 */
'use strict';

const SITES = [
  { name: 'G42 Abu Dhabi',      lat: 24.45, lon:  54.38 },
  { name: 'Virginia / Ashburn', lat: 39.04, lon: -77.49 },
  { name: 'Lordstown OH',       lat: 41.18, lon: -80.70 },
];
const START = '2026-01-28';
const END   = '2026-02-21';

// ── ERA5 via Open-Meteo archive ─────────────────────────────────────────────
async function fetchERA5(site) {
  const vars = 'temperature_2m_mean,temperature_2m_max,temperature_2m_min';
  const url  = `https://archive-api.open-meteo.com/v1/archive?latitude=${site.lat}&longitude=${site.lon}&start_date=${START}&end_date=${END}&daily=${vars}&timezone=UTC`;
  console.log('  URL:', url);
  const r = await fetch(url);
  const txt = await r.text();
  if (!r.ok) { console.log('  ERA5 error', r.status, txt.slice(0,300)); return null; }
  return JSON.parse(txt);
}

// ── MODIS LST via ORNL DAAC REST API ───────────────────────────────────────
// Docs: https://modis.ornl.gov/rst/api/v1/
async function fetchMODIS(site) {
  // First check what products are available
  const prodUrl = 'https://modis.ornl.gov/rst/api/v1/products';
  console.log('  Checking MODIS products...');
  try {
    const pr = await fetch(prodUrl, { headers: { Accept: 'application/json' } });
    const pd = await pr.json();
    const lstProducts = Array.isArray(pd) ? pd.filter(p => typeof p === 'string' && p.includes('MOD11')) :
                        (pd.products || pd.Products || []).filter(p => (p.productCode||p).includes('MOD11'));
    console.log('  LST-related products:', JSON.stringify(lstProducts).slice(0,300));
  } catch(e) { console.log('  Products check error:', e.message); }

  // Try MOD11A1 with version suffix
  for (const prod of ['MOD11A1.061', 'MOD11A1.006', 'MOD11A1', 'MYD11A1.061', 'MYD11A1']) {
    const url = `https://modis.ornl.gov/rst/api/v1/${prod}/subset?latitude=${site.lat}&longitude=${site.lon}&startDate=${START}&endDate=${END}&kmAboveBelow=0&kmLeftRight=0`;
    try {
      const r = await fetch(url, { headers: { Accept: 'application/json' } });
      if (r.ok) {
        console.log(`  MODIS product ${prod}: HTTP 200 ✓`);
        return { product: prod, data: await r.json() };
      } else {
        const t = await r.text();
        console.log(`  ${prod}: HTTP ${r.status} — ${t.slice(0,120)}`);
      }
    } catch(e) {
      console.log(`  ${prod}: error — ${e.message}`);
    }
  }
  return null;
}

// ── NASA AppEEARS API ────────────────────────────────────────────────────────
// AppEEARS is async (submit → wait → download). Not suitable for immediate fetch.
// But we can try the NASA Earthdata Search Granule API for CMR
async function fetchNASA_CMR(site) {
  // CMR (Common Metadata Repository) — search for MODIS LST granules
  const url = `https://cmr.earthdata.nasa.gov/search/granules.json?short_name=MOD11A1&version=061&temporal=${START}T00:00:00Z,${END}T23:59:59Z&bounding_box=${site.lon-0.1},${site.lat-0.1},${site.lon+0.1},${site.lat+0.1}&page_size=30&downloadable=true`;
  console.log('  NASA CMR URL:', url.slice(0,120)+'...');
  try {
    const r = await fetch(url);
    const d = await r.json();
    const granules = d.feed?.entry || [];
    console.log(`  CMR found ${granules.length} MOD11A1 granules`);
    granules.slice(0,5).forEach(g => {
      console.log(`    ${g.time_start?.slice(0,10)} — ${g.title}`);
    });
    return granules;
  } catch(e) {
    console.log('  CMR error:', e.message);
    return [];
  }
}

// ── Try OpenMeteo for ERA5 skin/surface temps ───────────────────────────────
async function fetchERA5Extended(site) {
  // Try with hourly skin temperature (ERA5 variable: skin_temperature)
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${site.lat}&longitude=${site.lon}&start_date=${START}&end_date=${END}&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&hourly=surface_temperature&timezone=UTC`;
  console.log('  Extended URL:', url.slice(0,120)+'...');
  const r = await fetch(url);
  if (!r.ok) {
    const t = await r.text();
    console.log('  Extended error', r.status, t.slice(0,200));
    // Try without hourly
    const url2 = `https://archive-api.open-meteo.com/v1/archive?latitude=${site.lat}&longitude=${site.lon}&start_date=${START}&end_date=${END}&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min&timezone=UTC`;
    const r2 = await fetch(url2);
    if (!r2.ok) { console.log('  Fallback also failed', r2.status); return null; }
    return r2.json();
  }
  return r.json();
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== REAL SURFACE DATA FETCH · TRIAL DATES ===\n');

  for (const site of SITES) {
    console.log('\n' + '='.repeat(65));
    console.log(`SITE: ${site.name}  (${site.lat}N, ${site.lon}E)`);
    console.log('='.repeat(65));

    // ERA5
    console.log('\n[1] ERA5/ECMWF via Open-Meteo Archive');
    const era5 = await fetchERA5Extended(site);
    if (era5?.daily) {
      const { time, temperature_2m_mean: t2, temperature_2m_max: tx, temperature_2m_min: tn } = era5.daily;
      const PERIODS = [
        ['Friction  Jan28-Feb3',  '2026-01-28','2026-02-03'],
        ['THE DROP  Feb4-6',      '2026-02-04','2026-02-06'],
        ['Recoil    Feb7-12',     '2026-02-07','2026-02-12'],
        ['Trial2    Feb13-15',    '2026-02-13','2026-02-15'],
        ['Melt      Feb16-21',    '2026-02-16','2026-02-21'],
      ];
      for (const [label, s, e] of PERIODS) {
        const idx = time.reduce((a,t,i)=>t>=s&&t<=e?[...a,i]:a,[]);
        if (!idx.length) { console.log(`  ${label}: no data`); continue; }
        const avg = v => (idx.reduce((a,i)=>a+(v[i]??0),0)/idx.length).toFixed(2);
        const max = v => Math.max(...idx.map(i=>v[i]??-99)).toFixed(1);
        const min = v => Math.min(...idx.map(i=>v[i]??99)).toFixed(1);
        console.log(`  ${label}: mean=${avg(t2)}°C  max=${max(tx)}°C  min=${min(tn)}°C  (n=${idx.length} days)`);
      }
    }

    // MODIS
    console.log('\n[2] MODIS MOD11A1 Terra LST via ORNL DAAC');
    const modis = await fetchMODIS(site);
    if (modis) {
      const d = modis.data;
      if (d.subset) {
        const lst = d.subset.find(b => b.band?.includes('LST_Day'));
        if (lst) {
          console.log(`  Found band: ${lst.band} (scale=${lst.scale}, units=${lst.units})`);
          lst.data?.forEach(row => {
            const raw = Array.isArray(row.data) ? row.data[0] : row.data;
            if (raw > 0) {
              const c = (raw * (lst.scale||0.02) - 273.15).toFixed(1);
              let flag = '';
              const dt = row.calendarDate || '';
              if (dt >= '2026-01-28' && dt <= '2026-02-03') flag = ' [Friction]';
              if (dt >= '2026-02-04' && dt <= '2026-02-06') flag = ' [THE DROP]';
              if (dt >= '2026-02-13' && dt <= '2026-02-15') flag = ' [Trial2]';
              console.log(`    ${dt}  LST_day=${c}°C${flag}`);
            }
          });
        } else {
          console.log('  Bands available:', d.subset.map(b=>b.band).join(', '));
        }
      } else {
        console.log('  Response:', JSON.stringify(d).slice(0,400));
      }
    }

    // NASA CMR granule index
    console.log('\n[3] NASA CMR — MODIS granule availability check');
    await fetchNASA_CMR(site);
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
