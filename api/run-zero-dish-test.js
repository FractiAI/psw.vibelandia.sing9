/**
 * Zero-Dish Services Demo + Test API
 *
 * Runs demo-zero-dish-services.mjs then test-zero-dish-demo.mjs in a temp dir,
 * returns receipt + outputs + test log. Used by the Zero-Dish Test page.
 *
 * NSPFRNP → ∞⁹
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');

function latestFile(dir, prefix) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.json'))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtime }))
    .sort((a, b) => b.mtime - a.mtime);
  return files.length ? path.join(dir, files[0].name) : null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const root = path.resolve(process.cwd());
  const scriptsDir = path.join(root, 'scripts');
  const demoScript = path.join(scriptsDir, 'demo-zero-dish-services.mjs');
  const testScript = path.join(scriptsDir, 'test-zero-dish-demo.mjs');

  if (!fs.existsSync(demoScript) || !fs.existsSync(testScript)) {
    return res.status(500).json({
      success: false,
      error: 'Demo or test script not found (run from repo root).',
      receipt: null,
      outputs: {},
      testLog: '',
    });
  }

  const tmpDir = path.join(os.tmpdir(), `zero-dish-demo-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  const env = { ...process.env, DEMO_OUTPUT_DIR: tmpDir };

  // Run demo
  const demoRes = spawnSync('node', [demoScript], {
    cwd: root,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const demoStdout = (demoRes.stdout || '').toString();
  const demoStderr = (demoRes.stderr || '').toString();
  if (demoRes.status !== 0) {
    return res.status(500).json({
      success: false,
      error: 'Demo script failed.',
      demoStdout,
      demoStderr,
      receipt: null,
      outputs: {},
      testLog: '',
    });
  }

  // Run test (with --run-demo so it uses existing outputs)
  const testRes = spawnSync('node', [testScript], {
    cwd: root,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const testStdout = (testRes.stdout || '').toString();
  const testStderr = (testRes.stderr || '').toString();
  const testOk = testRes.status === 0;

  // Read receipt and outputs
  let receipt = null;
  const receiptPath = latestFile(tmpDir, 'space-cloud-cycle-');
  if (receiptPath && fs.existsSync(receiptPath)) {
    try {
      receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
    } catch (_) {}
  }

  const readJson = (p) => {
    if (!p || !fs.existsSync(p)) return null;
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (_) {
      return null;
    }
  };

  const latticePath = latestFile(tmpDir, 'lattice-sync-');
  const cryoPath = latestFile(tmpDir, 'cryo-inference-');
  const braggPath = latestFile(tmpDir, 'bragg-archive-');

  const outputs = {
    lattice_sync: readJson(latticePath),
    cryo_inference: readJson(cryoPath),
    bragg_archive: readJson(braggPath),
  };

  return res.status(200).json({
    success: testOk,
    testLog: testStdout + (testStderr ? '\n' + testStderr : ''),
    receipt,
    outputs,
    demoLog: demoStdout + (demoStderr ? '\n' + demoStderr : ''),
  });
};
