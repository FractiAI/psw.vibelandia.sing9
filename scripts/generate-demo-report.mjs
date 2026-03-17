#!/usr/bin/env node
/**
 * Build-time: run Zero-Dish demo + test and write public/demo-report.json
 * so the "Run test now" button can show a report when the API is unavailable.
 * NSPFRNP → ∞⁹
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'demo-output');
const publicDir = path.join(root, 'public');

function latestFile(prefix) {
  if (!fs.existsSync(outDir)) return null;
  const files = fs.readdirSync(outDir)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.json'))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(outDir, f)).mtime }))
    .sort((a, b) => b.mtime - a.mtime);
  return files.length ? path.join(outDir, files[0].name) : null;
}

function runDemo() {
  const res = spawnSync('node', [path.join(root, 'scripts', 'demo-zero-dish-services.mjs')], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  return res.status === 0;
}

function runTest() {
  const res = spawnSync('node', [path.join(root, 'scripts', 'test-zero-dish-demo.mjs')], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  return { ok: res.status === 0, log: (res.stdout || '') + (res.stderr ? '\n' + res.stderr : '') };
}

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

runDemo();
const testResult = runTest();

const receiptPath = latestFile('space-cloud-cycle-');
const latticePath = latestFile('lattice-sync-');
const cryoPath = latestFile('cryo-inference-');
const braggPath = latestFile('bragg-archive-');

const readJson = (p) => {
  if (!p || !fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return null; }
};

const report = {
  success: testResult.ok,
  testLog: testResult.log,
  receipt: readJson(receiptPath),
  outputs: {
    lattice_sync: readJson(latticePath),
    cryo_inference: readJson(cryoPath),
    bragg_archive: readJson(braggPath),
  },
  source: 'build',
  generated_at: new Date().toISOString(),
};

fs.writeFileSync(path.join(publicDir, 'demo-report.json'), JSON.stringify(report, null, 2), 'utf8');
console.log('[generate-demo-report] Wrote public/demo-report.json (success:', testResult.ok, ')');
