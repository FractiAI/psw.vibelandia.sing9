/**
 * Passive RF engineering probe — Tier 0 (automated, free, legal, no human).
 *
 * Uses only public HTTPS GET to OpenWebRX /status.json (receiver metadata + profile geometry).
 * Does NOT provide IQ, PSD, or noise temperature — see docs/HYDROGEN_LINE_PASSIVE_RF_ENGINEERING_PROTOCOL.md
 * for Tier 1 (optional IQ file) and full falsifiability criteria.
 *
 * NSPFRNP → ∞⁹
 */
import {
  fetchOpenWebRxPublicStatus,
  findProfileCoveringHiRest,
  H_I_REST_HZ,
  H_I_REST_MHZ,
  DEFAULT_OPENWEBRX_BASES,
  parseOpenWebRxBaseList,
} from './openwebrx-public-evidence.mjs';

function uniqueBases(extra) {
  const envFirst = parseOpenWebRxBaseList();
  const raw = [...envFirst, ...(extra || []), ...DEFAULT_OPENWEBRX_BASES];
  const seen = new Set();
  return raw
    .map((b) => String(b).trim().replace(/\/$/, ''))
    .filter((b) => {
      if (!b || seen.has(b)) return false;
      seen.add(b);
      return true;
    });
}

/**
 * Enumerate every profile on every SDR in status and compute passband + HI inclusion.
 * @param {object} status - Parsed /status.json
 */
export function enumerateProfileGeometry(status) {
  const rows = [];
  const sdrs = status?.sdrs;
  if (!Array.isArray(sdrs)) return rows;
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
      const includes_hi_rest = lo <= H_I_REST_HZ && hi >= H_I_REST_HZ;
      rows.push({
        sdr_name: sdr.name || '—',
        profile_name: p.name || '—',
        center_freq_hz: cf,
        sample_rate_hz: sr,
        passband_lo_hz: lo,
        passband_hi_hz: hi,
        includes_hi_rest,
      });
    }
  }
  return rows;
}

/**
 * Tier 0: HTTP-only passive probe. Fetches /status.json per base; validates geometry vs findProfileCoveringHiRest.
 *
 * @param {{ signal?: AbortSignal, bases?: string[], repeat_passes?: number, pass_delay_ms?: number }} [opts]
 */
export async function runPassiveRfEngineeringProbeTier0(opts = {}) {
  const signal = opts.signal;
  const bases = uniqueBases(opts.bases);
  const repeatPasses = Math.max(1, Math.min(20, Number(opts.repeat_passes) || 1));
  const passDelayMs = Math.max(0, Math.min(10000, Number(opts.pass_delay_ms) || 0));

  const passes = [];
  for (let pass = 0; pass < repeatPasses; pass++) {
    if (pass > 0 && passDelayMs > 0) {
      await new Promise((r) => setTimeout(r, passDelayMs));
    }
    const perBase = [];
    for (const base of bases) {
      const statusUrl = base + '/status.json';
      let status = null;
      let httpOk = false;
      let err = null;
      try {
        const r = await fetch(statusUrl, {
          signal,
          headers: { Accept: 'application/json' },
        });
        httpOk = r.ok;
        if (r.ok) status = await r.json();
        else err = 'HTTP ' + r.status;
      } catch (e) {
        err = e?.message || String(e);
      }

      const profiles = status ? enumerateProfileGeometry(status) : [];
      const anyIncludesHi = profiles.some((p) => p.includes_hi_rest);
      const finderProfile = status ? findProfileCoveringHiRest(status) : null;

      let geometryConsistent = true;
      if (status && profiles.length) {
        if (anyIncludesHi && !finderProfile) geometryConsistent = false;
        if (finderProfile) {
          const match = profiles.find(
            (p) =>
              p.includes_hi_rest &&
              p.sdr_name === finderProfile.sdr_name &&
              p.profile_name === finderProfile.profile_name
          );
          if (!match) geometryConsistent = false;
        }
      }

      perBase.push({
        base,
        status_json_url: statusUrl,
        http_ok: httpOk,
        fetch_error: err,
        receiver_name: status?.receiver?.name || null,
        profiles_geometry: profiles,
        observable_hi_passband: anyIncludesHi,
        finder_profile: finderProfile,
        null_geometry_check: {
          finder_matches_enumeration: geometryConsistent,
          description:
            'If any profile geometrically includes H I rest, findProfileCoveringHiRest must return a profile; else null.',
        },
      });
    }
    passes.push({
      pass_index: pass,
      fetched_at_utc: new Date().toISOString(),
      per_base: perBase,
    });
  }

  const preferred = await fetchOpenWebRxPublicStatus({
    signal,
    bases: opts.bases,
  });

  const lastPass = passes[passes.length - 1];
  const allGeometryChecksPass =
    lastPass &&
    lastPass.per_base.every(
      (row) => !row.http_ok || row.null_geometry_check.finder_matches_enumeration !== false
    );
  let httpSuccessCount = 0;
  if (lastPass) {
    for (const row of lastPass.per_base) {
      if (row.http_ok) httpSuccessCount++;
    }
  }

  return {
    tier: 0,
    protocol: 'hline-passive-rf-tier0',
    hi_rest_hz: H_I_REST_HZ,
    hi_rest_mhz: H_I_REST_MHZ,
    limitations: {
      no_iq: true,
      no_psd: true,
      no_noise_temperature: true,
      note:
        'Observables are HTTP metadata and passband geometry only. PSD, correlation detector, and EGS-keyed RF demodulation require Tier 1+ (IQ capture or archive data).',
    },
    integration: {
      repeat_passes: repeatPasses,
      pass_delay_ms: passDelayMs,
      bases_scanned: bases,
    },
    passes,
    all_geometry_checks_pass: allGeometryChecksPass,
    http_success_count: httpSuccessCount,
    preferred_receiver_scan: preferred,
    null_hypothesis: {
      statement:
        'For each successful /status.json, passband geometry (lo, hi) is computed from center_freq and sample_rate; includes_hi_rest is true iff lo <= f_HI <= hi. The helper findProfileCoveringHiRest must agree with enumeration (no false negative when HI is in band).',
      falsify_if:
        'finder_matches_enumeration false for any base with http_ok and non-empty profiles — indicates implementation bug or malformed status.json.',
    },
    calibration: {
      rfi_rejection: 'Not applicable at Tier 0 (no spectrum data).',
      noise_floor_db: null,
      gain_stability: null,
      note: 'Attach calibrated IQ (Tier 1) for receiver noise floor and gain drift estimates.',
    },
    legal: {
      mode: 'passive_http_metadata_only',
      description:
        'Automated HTTPS GET to public OpenWebRX /status.json URLs only. No voice interception, no non-public endpoints, no transmit.',
      jurisdiction_note:
        'Operators remain responsible for local law; this software only fetches public receiver status.',
    },
    egs_key_in_rf: {
      applicable: false,
      note:
        'EGS as a physical decryption key in thermal noise is not tested at Tier 0. Tier 1+ must define detector D(r, θ) with explicit statistic and controlled IQ.',
    },
  };
}
