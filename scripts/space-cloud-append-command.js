#!/usr/bin/env node
/**
 * SPACE CLOUD COMMAND LOG — Append at execution time (NSPFRNP)
 *
 * Canonical way to append to commandLog in data/space-cloud-missions.json.
 * Run at time of each command execution so the Space Cloud dashboard shows
 * execution time. Invoked by hive/run.js, api/space-cloud.js (via GitHub
 * Action), or any NSPFRNP executor.
 *
 * Usage:
 *   node scripts/space-cloud-append-command.js "Space Cloud API; SURGE"
 *   node scripts/space-cloud-append-command.js "ECHO-SING executed; Goliath + clock"
 *
 * NSPFRNP → ∞⁹
 */
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const dataPath = path.join(repoRoot, 'data', 'space-cloud-missions.json');

const cmd = process.argv.slice(2).join(' ').trim() || 'Command executed (NSPFRNP)';

function nowUTC() {
  const d = new Date();
  return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

let data;
try {
  data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch (e) {
  console.error('[space-cloud-append-command] Failed to read', dataPath, e.message);
  process.exit(1);
}

const entry = { ts: nowUTC(), cmd };
if (!Array.isArray(data.commandLog)) data.commandLog = [];
data.commandLog.unshift(entry);
data.updated = new Date().toISOString();

try {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('[space-cloud-append-command] Appended:', entry.ts, entry.cmd.slice(0, 60) + (entry.cmd.length > 60 ? '…' : ''));
} catch (e) {
  console.error('[space-cloud-append-command] Failed to write', dataPath, e.message);
  process.exit(1);
}
