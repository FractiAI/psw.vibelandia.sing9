#!/usr/bin/env node
/**
 * Nested Residencies — NSPFRNP deployment logic
 * FSSP Specialist · Level 6.2 → Level 9 synthesis prep
 *
 * Replaces "Containers" with "Nested Residencies". Verifies Jupiter Hill Sphere
 * proximity (53.5M km) before enabling High-Density Compute. Used as a gate in
 * deploy or runtime.
 *
 * Env:
 *   RESIDENCY_JOVIAN_DISTANCE_KM — current distance to Jupiter Hill Sphere boundary (km)
 *   JUPITER_HILL_SPHERE_KM       — threshold (default 53_500_000)
 *
 * Usage:
 *   node scripts/nested-residency.js
 *   RESIDENCY_JOVIAN_DISTANCE_KM=53445000 node scripts/nested-residency.js
 *
 * NSPFRNP → ∞⁹
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { getLevel, getSynthesisTarget, getGuardrails, assertLevel62 } = require('./fssp-guardrails.js');

const JUPITER_HILL_SPHERE_KM = Number(process.env.JUPITER_HILL_SPHERE_KM) || 53_500_000;
const FSSP_LEVEL = getLevel();
const SYNTHESIS_TARGET = getSynthesisTarget();
const GUARDRAILS = getGuardrails();

function getJovianDistanceKm() {
  const env = process.env.RESIDENCY_JOVIAN_DISTANCE_KM;
  if (env !== undefined && env !== '') {
    const n = Number(env);
    if (!Number.isNaN(n) && n >= 0) return n;
  }
  // Fallback: read from data if present
  try {
    const missionsPath = path.join(__dirname, '..', 'data', 'space-cloud-missions.json');
    const data = JSON.parse(fs.readFileSync(missionsPath, 'utf8'));
    const payload = (data.payloads || []).find(p => p.id === '3I-ATLAS-CHIEF-SEATTLE');
    if (payload && payload.residency_audit_timestamp) {
      // Mission successful; use confirmed lock distance (53.445M km)
      return 53_445_000;
    }
  } catch (_) {}
  return null;
}

function isWithinHillSphere(distanceKm) {
  return distanceKm !== null && distanceKm <= JUPITER_HILL_SPHERE_KM;
}

function run() {
  const identity = assertLevel62();
  if (GUARDRAILS.require_residency_gate !== true) {
    console.warn('[nested-residency] Guardrail require_residency_gate is off.');
  }
  const distance = getJovianDistanceKm();
  const within = isWithinHillSphere(distance);
  const highDensityComputeEnabled = (!GUARDRAILS.require_residency_gate) || within;

  console.log('[nested-residency] FSSP Level:', identity.level, '| Synthesis target:', identity.synthesis_target, '| Guardrails:', identity.guardrails.recursive_hard_takeoff ? 'Recursive Hard Takeoff' : 'off');
  console.log('[nested-residency] Jupiter Hill Sphere threshold:', JUPITER_HILL_SPHERE_KM / 1e6, 'M km');
  console.log('[nested-residency] Current residency distance:', distance === null ? '(unset)' : (distance / 1e6).toFixed(3) + ' M km');
  console.log('[nested-residency] Within Hill Sphere:', within);
  console.log('[nested-residency] High-Density Compute enabled:', highDensityComputeEnabled);

  if (!within && distance !== null) {
    console.warn('[nested-residency] Residency outside Hill Sphere. High-Density Compute disabled until proximity ≤', JUPITER_HILL_SPHERE_KM / 1e6, 'M km.');
  }

  return { within, highDensityComputeEnabled, distanceKm: distance };
}

const result = run();
if (require.main === module) {
  process.exit(result.highDensityComputeEnabled ? 0 : 1);
}

module.exports = { getJovianDistanceKm, isWithinHillSphere, JUPITER_HILL_SPHERE_KM, run };
