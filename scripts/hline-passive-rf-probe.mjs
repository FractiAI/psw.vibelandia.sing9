#!/usr/bin/env node
/**
 * CLI: Tier 0 passive RF engineering probe (OpenWebRX /status.json only).
 * Usage: npm run probe:passive-rf
 */
import { runPassiveRfEngineeringProbeTier0 } from '../lib/hline-passive-rf-probe.mjs';

const signal = AbortSignal.timeout(45000);
const bases = process.env.OPENWEBRX_BASE_URLS
  ? process.env.OPENWEBRX_BASE_URLS.split(',')
      .map((s) => s.trim().replace(/\/$/, ''))
      .filter(Boolean)
  : undefined;

const result = await runPassiveRfEngineeringProbeTier0({
  signal,
  bases,
  repeat_passes: Number(process.env.PASSIVE_RF_REPEAT || 1) || 1,
  pass_delay_ms: Number(process.env.PASSIVE_RF_DELAY_MS || 0) || 0,
});

console.log(JSON.stringify(result, null, 2));
process.exit(
  result.all_geometry_checks_pass && result.http_success_count > 0 ? 0 : 1
);
