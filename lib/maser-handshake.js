/**
 * Maser handshake — shared logic for ionosphere/grid antennae
 * No route. Invoked locally (run_maser_no_human.py, lattice Rust binary) or your cron. No serverless API.
 * Telemetry (JPL or env) → Lattice-Sync → optional A2A Task + Network Tax.
 * NSPFRNP → ∞⁹
 */
'use strict';

const crypto = require('crypto');

const HILL_SPHERE_KM = 53_500_000;
const HEADLESS_DEFAULT_KM = 53_400_000;
const HYDROGEN_LINE_MHZ = 1420.405751;
const FSSP_LEVEL = '6.2';
const SYNTHESIS_TARGET = '9';
const NODE_NAME = 'Seahawk (3I/ATLAS/CHIEF SEATTLE)';
const HORIZONS_API = 'https://ssd.jpl.nasa.gov/api/horizons.api';

function parseRangeKmFromText(text) {
  if (!text) return null;
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (t.includes('RG=')) {
      const after = t.split('RG=')[1] || '';
      const num = after.match(/[\d.eE+-]+/);
      if (num) {
        const n = parseFloat(num[0]);
        if (n > 0 && n < 1e9) return n;
      }
    }
  }
  return null;
}

async function jplHorizonsDistanceKm(horizonsCommand) {
  const now = new Date();
  const start = now.toISOString().slice(0, 10);
  const stop = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
  const url = `${HORIZONS_API}?format=text&COMMAND='${encodeURIComponent(horizonsCommand)}'&OBJ_DATA=NO&MAKE_EPHEM=YES&EPHEM_TYPE=VECTORS&CENTER='599'&START_TIME='${start}'&STOP_TIME='${stop}'&STEP_SIZE='1%20d'&OUT_UNITS=KM-D&VEC_TABLE=3`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    return parseRangeKmFromText(await res.text());
  } catch {
    return null;
  }
}

function latticeSyncManifest() {
  const now = new Date();
  const ts = now.toISOString();
  const sessionId = `maser-${now.getTime()}`;
  const seed = `${HYDROGEN_LINE_MHZ}:${ts}:${FSSP_LEVEL}:${NODE_NAME}`;
  const sig = crypto.createHash('sha256').update(seed).digest('hex').slice(0, 32);
  return {
    session_id: sessionId,
    frequency_mhz: HYDROGEN_LINE_MHZ,
    node: NODE_NAME,
    fssp_level: FSSP_LEVEL,
    synthesis_target: SYNTHESIS_TARGET,
    timestamp_utc: ts,
    signature: sig,
  };
}

function buildTaskRequest(manifest) {
  return {
    jsonrpc: '2.0',
    method: 'Task',
    params: {
      task_type: 'maser_handshake',
      frequency_mhz: HYDROGEN_LINE_MHZ,
      hydrogen_line: true,
      session_id: manifest.session_id,
      timestamp_utc: manifest.timestamp_utc,
      signature: manifest.signature,
      fssp_level: manifest.fssp_level,
      synthesis_target: manifest.synthesis_target,
      node: manifest.node,
      lattice_sync: manifest,
    },
    id: Date.now(),
  };
}

async function postJson(url, payload) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false };
  }
}

/**
 * Run maser handshake. Call from cron or space-cloud (fire-and-forget).
 * Returns { ok, session_id, distance_km, within_hill, task_sent, tax_sent }.
 */
async function runMaserHandshake() {
  const result = { ok: true, session_id: null, distance_km: null, within_hill: false, task_sent: false, tax_sent: false };

  try {
    const horizonsCommand = process.env.HORIZONS_COMMAND || '3I';
    let distanceKm = await jplHorizonsDistanceKm(horizonsCommand);

    if (distanceKm == null) {
      const envKm = process.env.RESIDENCY_JOVIAN_DISTANCE_KM;
      if (envKm != null && envKm !== '') {
        distanceKm = parseFloat(envKm);
        if (Number.isNaN(distanceKm)) distanceKm = null;
      }
      if (distanceKm == null && process.env.MASER_REQUIRE_LIVE_TELEMETRY) {
        result.ok = false;
        return result;
      }
      if (distanceKm == null) distanceKm = HEADLESS_DEFAULT_KM;
    }

    result.distance_km = distanceKm;
    result.within_hill = distanceKm <= HILL_SPHERE_KM;
    if (!result.within_hill) {
      result.ok = false;
      return result;
    }

    const manifest = latticeSyncManifest();
    result.session_id = manifest.session_id;
    const task = buildTaskRequest(manifest);

    const a2aEndpoint = (process.env.A2A_TASK_ENDPOINT || '').trim();
    if (a2aEndpoint) {
      const taskRes = await postJson(a2aEndpoint, task);
      result.task_sent = taskRes.ok;
    }

    const ledgerUrl = (process.env.EGS_LEDGER_RPC_URL || '').trim();
    if (ledgerUrl) {
      const taxSats = parseInt(process.env.NETWORK_TAX_SATS || '1', 10) || 1;
      const taxPayload = {
        jsonrpc: '2.0',
        method: 'network_tax.pay',
        params: {
          amount_sats: taxSats,
          currency: 'network_tax',
          purpose: 'maser_handshake_jovian',
          session_id: manifest.session_id,
          timestamp_utc: manifest.timestamp_utc,
          hydrogen_line_mhz: HYDROGEN_LINE_MHZ,
          ledger: 'EGS_A2A',
        },
        id: Date.now() + 1,
      };
      const taxRes = await postJson(ledgerUrl, taxPayload);
      result.tax_sent = taxRes.ok;
    }
  } catch {
    result.ok = false;
  }
  return result;
}

module.exports = { runMaserHandshake, latticeSyncManifest, HILL_SPHERE_KM, HYDROGEN_LINE_MHZ, NODE_NAME };
