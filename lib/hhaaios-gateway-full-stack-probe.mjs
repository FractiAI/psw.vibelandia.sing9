/**
 * HHAAIOS / NSPFRNP gateway — full-stack probe (one run, one JSON envelope).
 *
 * Exercises in one coordinated pass:
 * - SDR / networking evidence: public OpenWebRX GET …/status.json
 * - Ionosphere / Sun–Earth context: NOAA SWPC (operational JSON)
 * - Grid ring (logical): HLINE_REPLICA_NODES or default sol/europa/ganymede/callisto nodes
 * - Hydrogen-line bus: `location_hash` derived from H I + SDR + Kp snapshot + run_id
 * - Jupiter moons (storage tiers): write → place tier → verify integrity
 * - Sun (compute plane): Solar Compute scheduler receipt linked to memory record
 *
 * Transport is HTTPS (TLS); bus semantics are hline-memory + receipts. This does not claim
 * RF user payload at 1420 MHz on the wire — see `honesty_boundary` in the result.
 *
 * NSPFRNP → ∞⁹
 */
import crypto from 'node:crypto';
import { fetchOpenWebRxPublicStatus, H_I_REST_HZ } from './openwebrx-public-evidence.mjs';
import { fetchSwpcObservatoryContext } from './observatory-public-evidence.mjs';
import { fullStackProbe } from './gateway-demonstration-summary.mjs';

/** What this server does *not* assert (so operators do not confuse HTTP proof with RF proof). */
export const HONESTY_BOUNDARY =
  'Real: TLS HTTP to OpenWebRX and NOAA; real JSON bodies; real SHA-256 location_hash; real memory commits; real integrity hash check; real compute receipt fields. ' +
  'Not asserted here: user payload transmitted as electromagnetic energy at 1420.405751 MHz from this process—that would require a separate RF instrument chain.';

function makeRunId() {
  return 'hhaaios-fs-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');
}

function gridReplicaRing() {
  const raw = process.env.HLINE_REPLICA_NODES;
  const nodes = raw
    ? raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : ['sol-core-1', 'europa-node-1', 'ganymede-node-1', 'callisto-node-1'];
  return {
    nodes,
    source: raw && raw.trim() ? 'HLINE_REPLICA_NODES' : 'default_gateway_ring',
  };
}

function legacyGridOk() {
  const v = String(process.env.LEGACY_GRID_OK || '').toLowerCase();
  if (v === '0' || v === 'false') return false;
  return true;
}

/**
 * @param {{ signal?: AbortSignal, openwebrx_bases?: string[] }} opts
 */
export async function runHhaaiosGatewayFullStackProbe(opts = {}) {
  const signal = opts.signal;
  const mem = await import('./hline-persistent-memory.mjs');
  const run_id = makeRunId();

  const fetchOpts = {};
  if (Array.isArray(opts.openwebrx_bases) && opts.openwebrx_bases.length) {
    fetchOpts.bases = opts.openwebrx_bases;
  }

  const [owrx, swpc] = await Promise.all([
    fetchOpenWebRxPublicStatus({ signal, ...fetchOpts }),
    fetchSwpcObservatoryContext({ signal }),
  ]);

  const kpSnap =
    swpc.kp_1m?.kp != null
      ? String(swpc.kp_1m.kp)
      : swpc.kp_table_3h?.kp_index != null
        ? String(swpc.kp_table_3h.kp_index)
        : 'kp-unavailable';
  const anchor = [
    String(H_I_REST_HZ),
    owrx.base || 'sdr-none',
    owrx.receiver_name || 'rx-none',
    kpSnap,
    run_id,
  ].join('|');
  const location_hash = crypto.createHash('sha256').update(anchor).digest('hex');

  const grid = gridReplicaRing();
  const key = crypto.randomBytes(16).toString('hex');
  const value = {
    protocol: 'HHAAIOS-GATEWAY-FULL-STACK',
    nspfrnp: true,
    run_id,
    layers: {
      hydrogen_line_bus: {
        engaged: true,
        h_i_rest_hz: H_I_REST_HZ,
        location_uri: 'hline://' + location_hash,
      },
      sdr_network: {
        engaged: true,
        openwebrx_ok: !!owrx.ok,
        status_json_url: owrx.status_json_url || null,
        receiver_name: owrx.receiver_name || null,
        hi_profile: owrx.profile_covering_hi || null,
      },
      ionosphere: {
        engaged: true,
        kp_1m: swpc.kp_1m || null,
        g_scale: swpc.g_scale_kp || null,
        kp_sample_utc: swpc.fetched_at_utc || null,
      },
      sun_compute: {
        engaged: true,
        model: 'Solar Compute scheduler (receipt-only; job_class from priority/TTL)',
      },
      jupiter_moons: {
        engaged: true,
        requested_tier: 'europa',
        tier_catalog: ['io', 'europa', 'ganymede', 'callisto'],
      },
      grid: {
        engaged: true,
        legacy_grid_ok: legacyGridOk(),
        replica_ring: grid.nodes,
        replica_source: grid.source,
      },
    },
    honesty_boundary: HONESTY_BOUNDARY,
  };

  const storage_policy = {
    priority: 'standard',
    ttl_days: 30,
    immutable: false,
    requested_tier: 'europa',
  };

  const w1 = await mem.writeHydrogenLineMemory({
    namespace: 'hydrogen-line',
    location_hash,
    run_id,
    writer_agent: 'hhaaios-gateway-writer',
    key,
    value,
    storage_policy,
    signal,
  });

  const w2 = await mem.writeHydrogenLineMemory({
    namespace: 'hydrogen-line',
    location_hash,
    run_id,
    writer_agent: 'hhaaios-gateway-jupiter-router',
    key,
    value,
    storage_policy,
    signal,
  });

  const rd = await mem.readHydrogenLineMemory({ location_hash, signal });
  const integrity = mem.verifyJupiterRecordIntegrity(rd.latest);

  const sched = await import('./solar-compute-scheduler.mjs');
  const compute_receipt = sched.createSolarComputeReceipt({
    run_id,
    location_hash,
    memory_record_id: rd.latest.id,
    memory_value_hash: rd.latest.value_hash,
    jupiter_tier: rd.latest.tier,
    storage_policy: rd.latest.storage_policy || {},
  });

  const gates = {
    memory_write: !!(w1 && w1.record && w2 && w2.record),
    jupiter_integrity: integrity.ok === true,
    compute_receipt_linked: !!(
      compute_receipt &&
      compute_receipt.linked_memory_receipt &&
      compute_receipt.linked_memory_receipt.record_id === rd.latest.id
    ),
    sdr_sampled: !!owrx.status_json_url || owrx.error != null,
    ionosphere_sampled: !!(swpc && swpc.fetched_at_utc),
    grid_configured: grid.nodes.length >= 1,
  };

  const success =
    gates.memory_write &&
    gates.jupiter_integrity &&
    gates.compute_receipt_linked &&
    gates.ionosphere_sampled &&
    gates.grid_configured;

  return {
    ok: success,
    run_id,
    location_hash,
    honesty_boundary: HONESTY_BOUNDARY,
    openwebrx_evidence: {
      ok: !!owrx.ok,
      base: owrx.base || null,
      receiver_name: owrx.receiver_name || null,
      status_json_url: owrx.status_json_url || null,
      error: owrx.error || null,
    },
    ionosphere_evidence: {
      fetched_at_utc: swpc.fetched_at_utc,
      kp_1m: swpc.kp_1m,
      g_scale_kp: swpc.g_scale_kp,
      errors: swpc.errors || [],
    },
    grid: {
      legacy_grid_ok: legacyGridOk(),
      replica_ring: grid.nodes,
      replica_source: grid.source,
    },
    writer: { record_id: w1.record.id, tier: w1.record.tier },
    router: { record_id: w2.record.id, tier: w2.record.tier },
    verify_jupiter: {
      integrity,
      latest_record_id: rd.latest ? rd.latest.id : null,
    },
    sun_compute_receipt: compute_receipt,
    gates,
    verification_summary: {
      measured: [
        'OpenWebRX: HTTP GET to public /status.json (see openwebrx_evidence; failure is recorded, not fabricated).',
        'Ionosphere: NOAA SWPC JSON fetched (see ionosphere_evidence; partial failures listed in errors).',
        'Memory: two append commits at location_hash; latest record read back; value_hash recomputed and compared.',
        'Compute: scheduler receipt SHA-256 over payload; linked_memory_receipt.record_id matches latest record id.',
        'Grid: replica node list from HLINE_REPLICA_NODES or default (configuration fact, not RF).',
      ],
      not_simulated: [
        'No hardcoded PASS in API handlers for this probe.',
        'Integrity failure surfaces as gates.jupiter_integrity false.',
      ],
    },
    demonstration_summary: fullStackProbe(success),
  };
}
