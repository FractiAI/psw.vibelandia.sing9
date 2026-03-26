/**
 * GET /api/hydrogen-line-agent-roundtrip
 *
 * Autonomous 3-agent test:
 * 1) Writer agent creates random key and writes to hydrogen-line namespace storage.
 * 2) Reader agent independently resolves same hydrogen-line location and reads key.
 * 3) Verifier agent confirms success/failure.
 *
 * Telemetry sourcing (legacy awareness only):
 * - OpenWebRX public /status.json context (optional)
 *
 * Storage model:
 * - Hydrogen-Line Persistent Memory (HLMEM v1) with Jupiter tier placement.
 * - No third-party write relay APIs.
 *
 * NSPFRNP -> infinity 9
 */
const crypto = require('crypto');

const FETCH_TIMEOUT_MS = 22000;
const H_I_REST_MHZ = 1420.405751768;
const H_I_REST_HZ = 1420405751.768;

function nowIso() {
  return new Date().toISOString();
}

function randomKey() {
  return crypto.randomBytes(16).toString('hex');
}

function makeRunId() {
  return 'hl-run-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');
}

async function getHydrogenLineContext(signal) {
  const mod = await import('../lib/openwebrx-public-evidence.mjs');
  const { fetchOpenWebRxPublicStatus } = mod;
  try {
    return await fetchOpenWebRxPublicStatus({ signal });
  } catch {
    return {
      ok: false,
      error: 'telemetry_unavailable',
      receiver_name: null,
      status_json_url: null,
      base: null,
      profile_covering_hi: null,
    };
  }
}

async function getPersistentMemory(signal) {
  return import('../lib/hline-persistent-memory.mjs');
}

function resolveHydrogenLineLocation({ runId, context }) {
  const anchor = [
    String(H_I_REST_HZ),
    // Telemetry contributes awareness metadata only; bus can run without it.
    String(context?.base || 'legacy-awareness-none'),
    String(context?.receiver_name || 'legacy-awareness-none'),
    String(context?.status_json_url || 'legacy-awareness-none'),
    String(runId),
  ].join('|');
  const locationHash = crypto.createHash('sha256').update(anchor).digest('hex');
  return {
    scheme: 'hline://',
    anchor,
    location_hash: locationHash,
    location_uri: 'hline://' + locationHash,
  };
}

async function writerAgent({ runId, location, context, signal }) {
  const key = randomKey();
  const payload = {
    protocol: 'H2L-ROUNDTRIP-DEMO',
    run_id: runId,
    written_at_utc: nowIso(),
    hydrogen_line_mhz: H_I_REST_MHZ,
    hydrogen_line_location: location.location_uri,
    openwebrx_receiver: context?.receiver_name || null,
    key,
    note: 'Writer agent payload stored in hydrogen-line namespaced persistent memory.',
  };
  const mem = await getPersistentMemory(signal);
  const write = await mem.writeHydrogenLineMemory({
    namespace: 'hydrogen-line',
    location_hash: location.location_hash,
    run_id: runId,
    writer_agent: 'writer',
    key,
    value: payload,
    storage_policy: {
      priority: 'standard',
      ttl_days: 30,
      immutable: false,
      requested_tier: 'europa',
    },
    signal,
  });

  return {
    agent: 'writer',
    status: 'ok',
    location_uri: location.location_uri,
    location_hash: location.location_hash,
    persistence_mode: write.mode,
    persistence_mode_detail: write.mode_detail,
    memory_record_id: write.record.id,
    jupiter_tier: write.record.tier,
    placement_receipt: write.placement_receipt,
    key,
    payload,
  };
}

async function readerAgent({ location, signal }) {
  const mem = await getPersistentMemory(signal);
  const read = await mem.readHydrogenLineMemory({
    location_hash: location.location_hash,
    signal,
  });
  const parsed = read.latest ? read.latest.value : null;
  if (!read.found || !parsed) {
    throw new Error('reader_not_found_at_hydrogen_line_location');
  }
  return {
    agent: 'reader',
    status: 'ok',
    location_uri: location.location_uri,
    location_hash: location.location_hash,
    persistence_mode: read.mode,
    persistence_mode_detail: read.mode_detail,
    memory_records_at_location: read.count,
    jupiter_tier: read.latest ? read.latest.tier : null,
    integrity: read.integrity,
    payload: parsed,
  };
}

function verifierAgent({ writer, reader, context }) {
  const checks = {
    location_uri_match: writer.location_uri === reader.location_uri,
    location_hash_match: writer.location_hash === reader.location_hash,
    run_id_match: writer.payload.run_id === reader.payload.run_id,
    key_match: writer.key === reader.payload.key,
    hydrogen_line_match:
      Number(reader.payload.hydrogen_line_mhz) === H_I_REST_MHZ &&
      Number(writer.payload.hydrogen_line_mhz) === H_I_REST_MHZ,
  };
  const ok = Object.values(checks).every(Boolean);

  return {
    agent: 'verifier',
    status: ok ? 'ok' : 'fail',
    success: ok,
    checks,
    summary: ok
      ? 'Roundtrip verified: writer key written/read at hydrogen-line location by independent agents.'
      : 'Roundtrip failed: one or more verifier checks failed.',
    context_summary: {
      openwebrx_ok: !!context?.ok,
      receiver: context?.receiver_name || null,
      status_json_url: context?.status_json_url || null,
      profile_covering_hi: context?.profile_covering_hi || null,
    },
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  const runId = makeRunId();
  const startedAt = nowIso();

  try {
    const context = await getHydrogenLineContext(signal);
    const location = resolveHydrogenLineLocation({ runId, context });
    const mem = await getPersistentMemory(signal);
    const memCfg = mem.getHydrogenLineMemoryConfigSummary();
    const writer = await writerAgent({ runId, location, context, signal });
    const reader = await readerAgent({ location, signal });
    const verifier = verifierAgent({ writer, reader, context });

    const finishedAt = nowIso();
    return res.status(verifier.success ? 200 : 500).json({
      ok: verifier.success,
      run_id: runId,
      started_at_utc: startedAt,
      finished_at_utc: finishedAt,
      no_human_involvement_required: true,
      public_free_only: true,
      bus_primary: true,
      telemetry_role: 'legacy_awareness_only',
      architecture: {
        agents: ['writer', 'reader', 'verifier'],
        storage_mode: memCfg.persistence_mode,
        hydrogen_line_namespace_mhz: H_I_REST_MHZ,
        hydrogen_line_location: location.location_uri,
        storage_tier: writer.jupiter_tier || 'europa',
      },
      persistence: memCfg,
      no_cloud_storage: memCfg.cloud_persistent !== true,
      no_external_write_api: true,
      human_intervention_required: false,
      sourcing: {
        public_free_apis: ['OpenWebRX /status.json'],
      },
      boundary:
        'Hydrogen bus is primary. Telemetry is legacy-awareness only and does not gate execution.',
      openwebrx_context: {
        ok: !!context?.ok,
        base: context?.base || null,
        receiver_name: context?.receiver_name || null,
        status_json_url: context?.status_json_url || null,
        profile_covering_hi: context?.profile_covering_hi || null,
      },
      writer,
      reader,
      verifier,
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      run_id: runId,
      started_at_utc: startedAt,
      finished_at_utc: nowIso(),
      no_human_involvement_required: true,
      public_free_only: true,
      no_cloud_storage: true,
      bus_primary: true,
      telemetry_role: 'legacy_awareness_only',
      error: e.message || String(e),
    });
  }
};
