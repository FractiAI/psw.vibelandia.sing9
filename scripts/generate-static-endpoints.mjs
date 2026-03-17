#!/usr/bin/env node
/**
 * Generate static JSON "endpoints" at build time — no serverless API.
 * Writes public/lattice-status.json and public/status.json so the site
 * has working status + lattice manifest URLs (refreshed each deploy).
 * NSPFRNP → ∞⁹
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');

const { latticeSyncManifest, HILL_SPHERE_KM, HYDROGEN_LINE_MHZ, NODE_NAME } = require('../lib/maser-handshake.js');

const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : (process.env.NEXT_PUBLIC_SITE_URL || 'https://psw-vibelandia-sing9.vercel.app');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

// 1) Lattice status — same shape as former /api/lattice-status (static snapshot at build time)
const manifest = latticeSyncManifest();
const latticeStatus = {
  ok: true,
  service: 'lattice-status',
  spec_version: 'zero_dish_hyperscale_1',
  lattice_sync: manifest,
  constants: {
    hill_sphere_km: HILL_SPHERE_KM,
    hydrogen_line_mhz: HYDROGEN_LINE_MHZ,
    node: NODE_NAME,
  },
  deploy_test: {
    agent_card: `${BASE_URL}/.well-known/agent.json`,
    status: `${BASE_URL}/status.json`,
    lattice_status: `${BASE_URL}/lattice-status.json`,
    executive_pivot: `${BASE_URL}/interfaces/executive-cloud-pivot.html`,
    tech_spec_anchor: `${BASE_URL}/interfaces/executive-cloud-pivot.html#tech-spec`,
  },
  note: 'Static file generated at build time. No serverless API. Handshake runs locally (run_maser_no_human.py, lattice Rust).',
};

fs.writeFileSync(
  path.join(publicDir, 'lattice-status.json'),
  JSON.stringify(latticeStatus, null, 2),
  'utf8'
);

// 2) Status — simple health / discovery (former /api/status)
const status = {
  status: 'OK - Sol-V is active',
  agent: 'Sol-V · SING 9 A2A Commerce Node',
  version: '9.0.0',
  protocol: 'NSPFRNP',
  no_serverless_api: true,
  static_only: true,
  agent_card: `${BASE_URL}/.well-known/agent.json`,
  lattice_status: `${BASE_URL}/lattice-status.json`,
  executive_pivot: `${BASE_URL}/interfaces/executive-cloud-pivot.html`,
  talk_first: `${BASE_URL}/interfaces/talk-first.html`,
};

fs.writeFileSync(
  path.join(publicDir, 'status.json'),
  JSON.stringify(status, null, 2),
  'utf8'
);

console.log('Generated public/lattice-status.json and public/status.json (static, no serverless).');
