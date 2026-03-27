/**
 * Three-agent gateway handshake over hydrogen-line memory with OpenWebRX (software radio) evidence.
 *
 * Agent 1 — initiator: writes envelope bound to live GET …/status.json snapshot.
 * Agent 2 — responder: reads shared location, writes acknowledgment + Agent 1 key linkage.
 * Agent 3 — verifier / troubleshooter: integrity + semantic checks; emits fix_suggestions on failure.
 *
 * Telemetry: legacy awareness only (public OpenWebRX). Bus: hydrogen-line memory.
 * NSPFRNP → ∞⁹
 */
import crypto from 'node:crypto';
import { fetchOpenWebRxPublicStatus, H_I_REST_HZ } from './openwebrx-public-evidence.mjs';
import { sdrGatewayHandshake } from './gateway-demonstration-summary.mjs';

function makeRunId() {
  return 'sdr-gw-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');
}

/**
 * @param {{ signal?: AbortSignal, openwebrx_bases?: string[] }} opts
 */
export async function runSdrGatewayAgentHandshake(opts = {}) {
  const signal = opts.signal;
  const mem = await import('./hline-persistent-memory.mjs');
  const run_id = makeRunId();

  const fetchOpts = {};
  if (Array.isArray(opts.openwebrx_bases) && opts.openwebrx_bases.length) {
    fetchOpts.bases = opts.openwebrx_bases;
  }
  const owrx = await fetchOpenWebRxPublicStatus({ signal, ...fetchOpts });

  const anchor = [
    String(H_I_REST_HZ),
    owrx.base || 'sdr-none',
    owrx.receiver_name || 'rx-none',
    run_id,
  ].join('|');
  const location_hash = crypto.createHash('sha256').update(anchor).digest('hex');

  const key1 = crypto.randomBytes(16).toString('hex');
  const value1 = {
    protocol: 'SDR-GW-A1',
    agent: '1',
    role: 'initiator',
    run_id,
    openwebrx: {
      ok: !!owrx.ok,
      base: owrx.base || null,
      receiver_name: owrx.receiver_name || null,
      status_json_url: owrx.status_json_url || null,
      hi_profile: owrx.profile_covering_hi || null,
    },
    note:
      'Agent 1 binds envelope to live OpenWebRX /status.json (software radio channel evidence).',
  };

  const w1 = await mem.writeHydrogenLineMemory({
    namespace: 'hydrogen-line',
    location_hash,
    run_id,
    writer_agent: 'gateway-agent-1-initiator',
    key: key1,
    value: value1,
    storage_policy: {
      priority: 'standard',
      ttl_days: 30,
      immutable: false,
      requested_tier: 'europa',
    },
    signal,
  });

  const readAfter1 = await mem.readHydrogenLineMemory({ location_hash, signal });
  if (!readAfter1.found || !readAfter1.latest) {
    return {
      ok: false,
      run_id,
      location_hash,
      openwebrx_evidence: summarizeOwrx(owrx),
      agent_1: { status: 'written', memory_record_id: w1.record.id, key: key1 },
      agent_2: { status: 'skipped', reason: 'read_after_agent_1_empty' },
      agent_3: {
        agent: '3',
        role: 'verifier_troubleshooter',
        success: false,
        integrity: null,
        checks: {},
        diagnostics: ['Hydrogen-line read returned no record after Agent 1 write.'],
        fix_suggestions: [
          {
            code: 'MEMORY_READ_EMPTY',
            fix: 'Check persistence (HLINE_GITHUB_* or serverless /tmp); retry run_sdr_gateway_agent_handshake.',
          },
        ],
      },
      demonstration_summary: sdrGatewayHandshake(false),
    };
  }

  const key2 = crypto.randomBytes(16).toString('hex');
  const value2 = {
    protocol: 'SDR-GW-A2',
    agent: '2',
    role: 'responder',
    run_id,
    acknowledges_key: key1,
    acknowledges_record_id: w1.record.id,
    peer_read_ok: !!(readAfter1.integrity && readAfter1.integrity.ok),
    sdr_channel_ok: !!owrx.ok,
    message:
      'Agent 2 acknowledges Agent 1 on shared hydrogen-line bus; SDR evidence chain attached.',
  };

  const w2 = await mem.writeHydrogenLineMemory({
    namespace: 'hydrogen-line',
    location_hash,
    run_id,
    writer_agent: 'gateway-agent-2-responder',
    key: key2,
    value: value2,
    storage_policy: {
      priority: 'standard',
      ttl_days: 30,
      immutable: false,
      requested_tier: 'europa',
    },
    signal,
  });

  const readFinal = await mem.readHydrogenLineMemory({ location_hash, signal });
  const latest = readFinal.latest;
  const v = mem.verifyJupiterRecordIntegrity(latest);

  const checks = {
    integrity_hash: v.ok,
    latest_is_agent_2: !!(latest && latest.value && String(latest.value.agent) === '2'),
    run_id_match: !!(latest && latest.value && latest.value.run_id === run_id),
    ack_key_match: !!(latest && latest.value && latest.value.acknowledges_key === key1),
    sdr_flag_consistent: !!(
      latest &&
      latest.value &&
      latest.value.sdr_channel_ok === !!owrx.ok
    ),
  };
  const success = Object.values(checks).every(Boolean);

  const fix_suggestions = [];
  if (!owrx.ok) {
    fix_suggestions.push({
      code: 'OPENWEBRX_UNREACHABLE',
      detail: owrx.error || 'unknown',
      fix: 'Set OPENWEBRX_BASE_URLS (comma-separated HTTPS bases with /status.json) or retry later.',
    });
  }
  if (!v.ok) {
    fix_suggestions.push({
      code: 'JUPITER_INTEGRITY',
      fix: 'Record value_hash mismatch or tier invalid — retry handshake; inspect integrity.checks.',
    });
  }
  if (!checks.latest_is_agent_2) {
    fix_suggestions.push({
      code: 'LAST_WRITER_NOT_AGENT_2',
      fix: 'Location contended or ordering issue — retry with new run_id (POST again).',
    });
  }
  if (!checks.ack_key_match) {
    fix_suggestions.push({
      code: 'ACK_MISMATCH',
      fix: 'Agent 2 did not acknowledge Agent 1 key — verify two writes at same location_hash.',
    });
  }
  if (!checks.sdr_flag_consistent) {
    fix_suggestions.push({
      code: 'SDR_FLAG_DRIFT',
      fix: 'Responder sdr_channel_ok does not match current OpenWebRX fetch — rare race; retry.',
    });
  }
  if (!success && fix_suggestions.length === 0) {
    fix_suggestions.push({
      code: 'GENERIC',
      fix: 'Retry handshake; confirm POST body reaches API (parse-json-body) and deploy has writable memory.',
    });
  }

  return {
    ok: success,
    run_id,
    location_hash,
    openwebrx_evidence: summarizeOwrx(owrx),
    agent_1: {
      status: 'ok',
      memory_record_id: w1.record.id,
      key: key1,
      placement_receipt: w1.placement_receipt,
    },
    agent_2: {
      status: 'ok',
      memory_record_id: w2.record.id,
      key: key2,
      read_after_agent_1: {
        found: readAfter1.found,
        count: readAfter1.count,
        integrity_ok: !!(readAfter1.integrity && readAfter1.integrity.ok),
      },
      placement_receipt: w2.placement_receipt,
    },
    agent_3: {
      agent: '3',
      role: 'verifier_troubleshooter',
      success,
      integrity: v,
      checks,
      diagnostics: success
        ? [
            'Handshake OK: OpenWebRX evidence sampled, Agent 1→2 memory chain verified, acknowledgments align.',
          ]
        : ['Verifier reported failure — see checks and fix_suggestions.'],
      fix_suggestions,
    },
    demonstration_summary: sdrGatewayHandshake(success),
  };
}

function summarizeOwrx(owrx) {
  return {
    ok: !!owrx.ok,
    base: owrx.base || null,
    receiver_name: owrx.receiver_name || null,
    status_json_url: owrx.status_json_url || null,
    profile_covering_hi: owrx.profile_covering_hi || null,
    error: owrx.error || null,
    hi_rest_mhz: owrx.hi_rest_mhz ?? null,
  };
}
