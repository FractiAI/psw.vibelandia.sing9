/**
 * Proof that a passive snapshot is captured on the hydrogen-line bus and readable back.
 *
 * Flow: GET public OpenWebRX /status.json (raw bytes) → SHA-256 → write hline record → read → verify integrity + hash match.
 * This is the falsifiable test for "mirrored hydrogen line platform" accessibility — not RF at 1420 MHz.
 *
 * NSPFRNP → ∞⁹
 */
import crypto from 'node:crypto';
import {
  fetchOpenWebRxPublicStatus,
  H_I_REST_HZ,
  H_I_REST_MHZ,
} from './openwebrx-public-evidence.mjs';

/**
 * @param {{ signal?: AbortSignal, openwebrx_bases?: string[] }} [opts]
 */
export async function runHydrogenLineMirrorPickupProof(opts = {}) {
  const signal = opts.signal;
  const mem = await import('./hline-persistent-memory.mjs');
  const run_id = 'hl-mirror-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');

  const fetchOpts = {};
  if (Array.isArray(opts.openwebrx_bases) && opts.openwebrx_bases.length) {
    fetchOpts.bases = opts.openwebrx_bases;
  }
  const owrx = await fetchOpenWebRxPublicStatus({ signal, ...fetchOpts });

  if (!owrx.ok || !owrx.status_json_url) {
    return {
      ok: false,
      run_id,
      error: 'no_openwebrx_snapshot',
      openwebrx: { ok: false, error: owrx.error || 'unavailable' },
    };
  }

  const r = await fetch(owrx.status_json_url, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!r.ok) {
    return {
      ok: false,
      run_id,
      error: 'status_json_http_' + r.status,
      source_url: owrx.status_json_url,
    };
  }
  const rawText = await r.text();
  const snapshot_sha256 = crypto.createHash('sha256').update(rawText, 'utf8').digest('hex');

  const anchor = [
    String(H_I_REST_HZ),
    'passive-mirror',
    run_id,
    snapshot_sha256.slice(0, 16),
  ].join('|');
  const location_hash = crypto.createHash('sha256').update(anchor).digest('hex');

  const key = crypto.randomBytes(16).toString('hex');
  const value = {
    protocol: 'HL-MIRROR-PICKUP-PROOF',
    run_id,
    mirror_assumption:
      'Passive public Web SDR metadata is mirrored onto the hydrogen-line bus for this proof.',
    source_url: owrx.status_json_url,
    picked_up_at_utc: new Date().toISOString(),
    snapshot_sha256,
    snapshot_bytes: Buffer.byteLength(rawText, 'utf8'),
    openwebrx_base: owrx.base,
    receiver_name: owrx.receiver_name,
  };

  const wr = await mem.writeHydrogenLineMemory({
    namespace: 'hydrogen-line',
    location_hash,
    run_id,
    writer_agent: 'hydrogen-line-passive-mirror',
    key,
    value,
    storage_policy: {
      priority: 'standard',
      ttl_days: 30,
      immutable: false,
      requested_tier: 'europa',
    },
    signal,
  });

  const rd = await mem.readHydrogenLineMemory({ location_hash, signal });
  const integrity = mem.verifyJupiterRecordIntegrity(rd.latest);

  const hashInValue =
    rd.latest &&
    rd.latest.value &&
    rd.latest.value.snapshot_sha256 === snapshot_sha256;
  const readBack = !!(hashInValue && integrity.ok);

  return {
    ok: readBack,
    run_id,
    location_hash,
    location_uri: 'hline://' + location_hash,
    snapshot_sha256,
    source_url: owrx.status_json_url,
    write: { record_id: wr.record.id, key },
    read: {
      found: rd.found,
      latest_record_id: rd.latest ? rd.latest.id : null,
      integrity,
      snapshot_sha256_matches_in_value: !!hashInValue,
    },
    proof: {
      accessible_on_mirrored_hydrogen_line:
        readBack &&
        'Record is readable at location_hash; value_hash integrity passes; snapshot_sha256 in stored value matches raw HTTP body hash.',
      falsify_if:
        'integrity.ok false, or snapshot_sha256 mismatch, or read.found false — capture not on bus or corruption.',
    },
    /** OpenWebRX Web SDR — use this URL in a browser tab or iframe to see spectrum/waterfall (public receiver UI). */
    sdr_view: {
      public_ui_url: owrx.base ? owrx.base.replace(/\/$/, '') + '/' : null,
      status_json_url: owrx.status_json_url,
      receiver_name: owrx.receiver_name || null,
      profile_covering_hi: owrx.profile_covering_hi || null,
      hi_rest_mhz: H_I_REST_MHZ,
      note:
        'Visual RF data (waterfall, spectrum) is shown by the OpenWebRX front end at public_ui_url. Hydrogen-line addressing (below) is the logical bus record tied to this passive snapshot.',
    },
    hydrogen_line_addressing: {
      scheme: 'hline://',
      location_hash,
      location_uri: 'hline://' + location_hash,
      anchor_convention:
        'sha256( H_I_REST_HZ | "passive-mirror" | run_id | snapshot_sha256[0:16] )',
      namespace: 'hydrogen-line',
    },
  };
}
