/**
 * SING! 9 Command Center (Back of House)
 * Command routing and immutable receipt generation for HHAAIOS/NSPFRNP.
 */
import crypto from 'node:crypto';
import { writeHydrogenLineMemory, readHydrogenLineMemory } from './hline-persistent-memory.mjs';
import { signVerifierReceipt } from './verifier-receipts.mjs';

export const SING9_MASTER_AGENT = 'SING! 9';
export const DEFAULT_REPORT_CHAIN = 'Chairman Creator of Syntheverse and Nested';

function nowIso() {
  return new Date().toISOString();
}

function makeCommandId() {
  return 'cmd-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');
}

export function supportedDomains() {
  return [
    'sun',
    'earth',
    'jupiter_moons',
    'solar',
    'galactic',
    'cosmic',
    'holographic',
  ];
}

export function deriveLocationHash({ domain, command_id }) {
  return crypto.createHash('sha256').update(`sing9-command|${domain}|${command_id}`).digest('hex');
}

async function getRealSensorSnapshot(signal) {
  const [obsMod, owrxMod] = await Promise.all([
    import('./observatory-public-evidence.mjs'),
    import('./openwebrx-public-evidence.mjs'),
  ]);
  const { fetchSwpcObservatoryContext } = obsMod;
  const { fetchOpenWebRxPublicStatus } = owrxMod;

  const swpc = await fetchSwpcObservatoryContext({ signal });
  const owrx = await fetchOpenWebRxPublicStatus({ signal });
  return {
    captured_at_utc: nowIso(),
    swpc: {
      kp_1m: swpc.kp_1m || null,
      kp_table_3h: swpc.kp_table_3h || null,
      g_scale_kp: swpc.g_scale_kp || null,
      rtsw_mag: swpc.rtsw_mag || null,
      rtsw_wind: swpc.rtsw_wind || null,
      f107: swpc.f107 || null,
      goes_xray: swpc.goes_xray || null,
      errors: swpc.errors || [],
    },
    openwebrx: {
      ok: !!owrx.ok,
      base: owrx.base || null,
      receiver_name: owrx.receiver_name || null,
      status_json_url: owrx.status_json_url || null,
      profile_covering_hi: owrx.profile_covering_hi || null,
      error: owrx.error || null,
    },
  };
}

function computeResponseTracking(issueSensors, statusSensors) {
  const issueKp = issueSensors?.swpc?.kp_1m?.kp;
  const statusKp = statusSensors?.swpc?.kp_1m?.kp;
  const issueBt = issueSensors?.swpc?.rtsw_mag?.bt_nT;
  const statusBt = statusSensors?.swpc?.rtsw_mag?.bt_nT;
  const out = {
    issue_captured_at_utc: issueSensors?.captured_at_utc || null,
    status_captured_at_utc: statusSensors?.captured_at_utc || null,
    kp_1m_delta: null,
    bt_nT_delta: null,
    tracked_signals: ['kp_1m', 'rtsw_mag.bt_nT', 'rtsw_wind', 'f107', 'goes_xray', 'openwebrx.status_json'],
  };
  if (Number.isFinite(Number(issueKp)) && Number.isFinite(Number(statusKp))) {
    out.kp_1m_delta = Number(statusKp) - Number(issueKp);
  }
  if (Number.isFinite(Number(issueBt)) && Number.isFinite(Number(statusBt))) {
    out.bt_nT_delta = Number(statusBt) - Number(issueBt);
  }
  return out;
}

export async function issueSing9Command({
  domain,
  command_text,
  mission,
  report_chain,
  signal,
}) {
  const command_id = makeCommandId();
  const d = String(domain || '').trim().toLowerCase();
  if (!supportedDomains().includes(d)) {
    throw new Error('unsupported_domain');
  }
  if (!command_text || typeof command_text !== 'string') {
    throw new Error('missing_command_text');
  }

  const issued_at_utc = nowIso();
  const location_hash = deriveLocationHash({ domain: d, command_id });
  const payload = {
    protocol: 'EGS-HHAAIOS-NSPFRNP-GATEWAY',
    command_id,
    issued_at_utc,
    domain: d,
    command_text,
    mission: mission || 'Configure and align target resources under NSPFRNP.',
    master_agent: SING9_MASTER_AGENT,
    report_chain: report_chain || DEFAULT_REPORT_CHAIN,
    execution_mode: 'software_orchestration_only',
    autonomy: 'no_human_intervention_required',
    confirmation_signals:
      'real sensor tracking enabled: NOAA SWPC + OpenWebRX snapshots at issue and status time',
    safety_boundary:
      'No physical actuation claim. Command represents orchestration intent and receipts only.',
  };
  const issue_sensors = await getRealSensorSnapshot(signal);
  payload.issue_sensors = issue_sensors;

  const wr = await writeHydrogenLineMemory({
    namespace: 'sing9-command-center',
    location_hash,
    run_id: command_id,
    writer_agent: SING9_MASTER_AGENT,
    key: 'command',
    value: payload,
    storage_policy: {
      requested_tier: 'callisto',
      immutable: true,
      priority: 'realtime',
      ttl_days: 3650,
    },
    signal,
  });

  const receipt = {
    command_id,
    issued_at_utc,
    location_hash,
    tier: wr.record.tier,
    placement_receipt: wr.placement_receipt,
    report_chain: payload.report_chain,
    master_agent: payload.master_agent,
    issue_sensor_snapshot: issue_sensors,
  };
  const signed = await signVerifierReceipt(receipt);
  return { payload, receipt, verifier_receipt: signed };
}

export async function getSing9CommandStatus({ domain, command_id, signal }) {
  const d = String(domain || '').trim().toLowerCase();
  const c = String(command_id || '').trim();
  if (!d || !c) throw new Error('domain_and_command_id_required');
  const location_hash = deriveLocationHash({ domain: d, command_id: c });
  const rd = await readHydrogenLineMemory({ location_hash, signal });
  const status_sensors = await getRealSensorSnapshot(signal);
  const response_tracking = computeResponseTracking(rd.latest?.value?.issue_sensors, status_sensors);
  return {
    found: rd.found,
    location_hash,
    command: rd.latest ? rd.latest.value : null,
    integrity: rd.integrity,
    tier: rd.latest ? rd.latest.tier : null,
    status_sensors,
    response_tracking,
  };
}

