/**
 * Cloud node compute / firmware-style probe (Vercel Node — CPU + crypto; optional remote GPU hook).
 * Set GPU_REMOTE_PROBE_URL to an HTTPS endpoint that returns JSON { ok, gpu, ... } for GPU-class nodes.
 * NSPFRNP → ∞⁹
 */
const os = require('os');
const crypto = require('crypto');

const FETCH_OPTS = { signal: AbortSignal.timeout(12000) };

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const t0 = Date.now();
  const buf = Buffer.alloc(256 * 1024, 0x5a);
  const hashHex = crypto.createHash('sha256').update(buf).digest('hex');
  const t1 = Date.now();

  const cpus = os.cpus() || [];
  const remote = { attempted: false, ok: null, status: null, body_preview: null, error: null };

  const gpuUrl = process.env.GPU_REMOTE_PROBE_URL;
  if (gpuUrl && /^https?:\/\//i.test(gpuUrl)) {
    remote.attempted = true;
    try {
      const r = await fetch(gpuUrl, FETCH_OPTS);
      remote.status = r.status;
      remote.ok = r.ok;
      const txt = await r.text();
      remote.body_preview = txt.slice(0, 400);
      try {
        remote.json = JSON.parse(txt);
      } catch {
        remote.json = null;
      }
    } catch (e) {
      remote.error = e.message || String(e);
    }
  }

  return res.status(200).json({
    ok: true,
    service: 'cloud-compute-probe',
    node_runtime: 'nodejs',
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
    vercel_region: process.env.VERCEL_REGION || null,
    cpu_count: cpus.length,
    cpu_model: cpus[0] && cpus[0].model,
    firmware_sha256_throughput_ms: t1 - t0,
    firmware_sha256_prefix: hashHex.slice(0, 24),
    note:
      'Default Vercel Node has no datacenter GPU; this proves live CPU + OpenSSL/crypto path. ' +
      'Point GPU_REMOTE_PROBE_URL at your GPU Lambda/RunPod/colab bridge to merge GPU telemetry.',
    remote_gpu_hook: remote.attempted ? remote : null,
    fetched_at_utc: new Date().toISOString(),
  });
};
