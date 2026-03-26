/**
 * OpenWebRX — open-source Web SDR (AGPL-3.0, https://github.com/jketterl/openwebrx).
 * Public receivers expose machine-readable GET /status.json (no manual tuning required to verify online status).
 *
 * NSPFRNP → ∞⁹
 */

/** IAU hydrogen line rest (Hz) — compare to OpenWebRX profile center_freq + sample_rate (Hz). */
export const H_I_REST_HZ = 1420405751.768;

/** Same constant in MHz (for display). */
export const H_I_REST_MHZ = 1420.405751768;

/**
 * Default public HTTPS receivers: each is tried; we prefer one whose passband covers H I rest.
 * Env OPENWEBRX_BASE_URLS (comma-separated) is prepended — use for an L-band OpenWebRX that lists 1420 MHz.
 * Order: scan all; return first with H I in passband, else first successful /status.json (no manual tuning).
 */
export const DEFAULT_OPENWEBRX_BASES = [
  'https://websdr.frogden.org:8443',
  'https://sdr2.justjakob.de',
  'https://websdr.bartosik.run',
];

function parseBaseList() {
  const raw = typeof process !== 'undefined' && process.env && process.env.OPENWEBRX_BASE_URLS;
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

/**
 * Find first SDR profile whose passband covers H I rest frequency.
 * @param {object} status - Parsed /status.json body
 * @returns {null | { sdr_name: string, sdr_type: string, profile_name: string, center_freq_hz: number, sample_rate_hz: number }}
 */
export function findProfileCoveringHiRest(status) {
  const sdrs = status?.sdrs;
  if (!Array.isArray(sdrs)) return null;
  for (const sdr of sdrs) {
    const profiles = sdr?.profiles;
    if (!Array.isArray(profiles)) continue;
    for (const p of profiles) {
      const cf = p.center_freq;
      const sr = p.sample_rate;
      if (cf == null || typeof cf !== 'number' || sr == null || typeof sr !== 'number') continue;
      const half = sr / 2;
      const lo = cf - half;
      const hi = cf + half;
      if (lo <= H_I_REST_HZ && hi >= H_I_REST_HZ) {
        return {
          sdr_name: sdr.name || '—',
          sdr_type: sdr.type || '—',
          profile_name: p.name || '—',
          center_freq_hz: cf,
          sample_rate_hz: sr,
        };
      }
    }
  }
  return null;
}

/**
 * @param {{ signal?: AbortSignal, bases?: string[] }} [opts]
 */
export async function fetchOpenWebRxPublicStatus(opts = {}) {
  const envFirst = parseBaseList();
  const bases = [...envFirst, ...(opts.bases || DEFAULT_OPENWEBRX_BASES)];
  const seen = new Set();
  const unique = bases.filter((b) => {
    const k = b.replace(/\/$/, '');
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const signal = opts.signal;
  let lastErr = 'no bases';
  let fallback = null;

  for (const base of unique) {
    const baseTrim = base.replace(/\/$/, '');
    const statusUrl = baseTrim + '/status.json';
    try {
      const r = await fetch(statusUrl, {
        signal,
        headers: { Accept: 'application/json' },
      });
      if (!r.ok) {
        lastErr = statusUrl + ' HTTP ' + r.status;
        continue;
      }
      const status = await r.json();
      const profile_covering_hi = findProfileCoveringHiRest(status);
      const rx = status?.receiver || {};
      const payload = {
        ok: true,
        base: baseTrim,
        public_ui_url: baseTrim + '/',
        status_json_url: statusUrl,
        receiver_name: rx.name || null,
        location: rx.location || null,
        gps: rx.gps || null,
        asl: rx.asl ?? null,
        version: status.version || null,
        max_clients: status.max_clients ?? null,
        hi_rest_mhz: H_I_REST_MHZ,
        profile_covering_hi,
        status,
      };
      if (profile_covering_hi) {
        return payload;
      }
      if (!fallback) {
        fallback = payload;
      }
    } catch (e) {
      lastErr = e?.message || String(e);
    }
  }

  if (fallback) {
    return fallback;
  }

  return {
    ok: false,
    error: lastErr,
    hi_rest_mhz: H_I_REST_MHZ,
  };
}
