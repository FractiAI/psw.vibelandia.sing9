/**
 * GET/POST /api/maser-handshake — Live A2A handshake in the cloud
 * No local run. Trigger from cron (Vercel Cron or external) or any HTTP call.
 *
 * 1. Telemetry: JPL Horizons or RESIDENCY_JOVIAN_DISTANCE_KM / headless default
 * 2. Agent Card + Lattice-Sync manifest + Task request
 * 3. POST Task to A2A_TASK_ENDPOINT (if set)
 * 4. Network Tax to EGS_LEDGER_RPC_URL (if set)
 *
 * Env: RESIDENCY_JOVIAN_DISTANCE_KM, HORIZONS_COMMAND, MASER_REQUIRE_LIVE_TELEMETRY,
 *      A2A_TASK_ENDPOINT, EGS_LEDGER_RPC_URL, NETWORK_TAX_SATS
 * NSPFRNP → ∞⁹
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const HILL_SPHERE_KM = 53_500_000;
const HEADLESS_DEFAULT_KM = 53_400_000;
const HYDROGEN_LINE_MHZ = 1420.405751;
const FSSP_LEVEL = '6.2';
const SYNTHESIS_TARGET = '9';
const NODE_NAME = 'Seahawk (3I/ATLAS/CHIEF SEATTLE)';
const HORIZONS_API = 'https://ssd.jpl.nasa.gov/api/horizons.api';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parseRangeKmFromHorizonsText(text) {
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
    const body = await res.text();
    return parseRangeKmFromHorizonsText(body);
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
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });
  return { ok: res.ok, status: res.status, body: await res.text() };
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const result = { ok: true, session_id: null, distance_km: null, within_hill: false, task_sent: false, tax_sent: false, error: null };

  try {
    // 1. Telemetry — no local run: use JPL or env/default
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
        result.error = 'No telemetry; set RESIDENCY_JOVIAN_DISTANCE_KM or allow headless default.';
        res.status(200).json(result);
        return;
      }
      if (distanceKm == null) distanceKm = HEADLESS_DEFAULT_KM;
    }

    result.distance_km = distanceKm;
    result.within_hill = distanceKm <= HILL_SPHERE_KM;
    if (!result.within_hill) {
      result.ok = false;
      result.error = `Outside Jupiter Hill Sphere (${(distanceKm / 1e6).toFixed(3)} M km > ${HILL_SPHERE_KM / 1e6} M km).`;
      res.status(200).json(result);
      return;
    }

    // 2. Lattice-Sync + Task (agent card loaded from same host by caller if needed)
    const manifest = latticeSyncManifest();
    result.session_id = manifest.session_id;
    const task = buildTaskRequest(manifest);

    // 3. A2A Task endpoint
    const a2aEndpoint = (process.env.A2A_TASK_ENDPOINT || '').trim();
    if (a2aEndpoint) {
      const taskRes = await postJson(a2aEndpoint, task);
      result.task_sent = taskRes.ok;
      if (!taskRes.ok) result.task_error = taskRes.body?.slice(0, 200);
    }

    // 4. EGS Network Tax
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
      result.tax_sent = taxRes.ok && taxRes.body && taxRes.body.includes('"result"');
    }
  } catch (e) {
    result.ok = false;
    result.error = e.message || String(e);
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(result);
};
