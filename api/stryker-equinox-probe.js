/**
 * Stryker beat timed to equinox window — from live site timer JSON.
 * NSPFRNP → ∞⁹
 */
const FETCH_OPTS = { signal: AbortSignal.timeout(12000) };

function siteBase() {
  const v = process.env.VERCEL_URL;
  if (v && v !== '') return `https://${v.replace(/\/$/, '')}`;
  const u = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://psw-vibelandia-sing9.vercel.app';
  return String(u).replace(/\/$/, '');
}

function parseIso(s) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const url = `${siteBase()}/data/stryker-equinox-timer.json`;
  try {
    const r = await fetch(url, FETCH_OPTS);
    if (!r.ok) {
      return res.status(200).json({
        ok: false,
        service: 'stryker-equinox-probe',
        error: 'timer_http_' + r.status,
        url,
      });
    }
    const t = await r.json();
    const win = t.equinox_window_utc || {};
    const start = parseIso(win.start);
    const end = parseIso(win.end);
    const mark = parseIso(t.stryker_mark_utc);
    const inWindow = start && end && mark && mark >= start && mark <= end;
    const timed = t.equinox_timed === true || t.stryker_timed_at_equinox === true;

    const ok = timed && inWindow && !!t.stryker_mark_utc;

    return res.status(200).json({
      ok,
      service: 'stryker-equinox-probe',
      stryker_mark_utc: t.stryker_mark_utc || null,
      equinox_timed: timed,
      stryker_timed_at_equinox: t.stryker_timed_at_equinox === true,
      mark_inside_equinox_window: !!inWindow,
      equinox_window_utc: t.equinox_window_utc || null,
      narrative: t.narrative || null,
      source: 'data/stryker-equinox-timer.json',
      fetched_at_utc: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(200).json({
      ok: false,
      service: 'stryker-equinox-probe',
      error: e.message || String(e),
      url,
    });
  }
};
