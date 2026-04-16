import assert from 'node:assert';
import { test } from 'node:test';

test('EGS fractal constant is golden ratio', async () => {
  const { EGS_FRACTAL } = await import('../../lib/egs-fractal-engine.mjs');
  assert.ok(Math.abs(EGS_FRACTAL - 1.618033988749895) < 1e-9);
});

test('emulateEgsPayload returns NAV and seed', async () => {
  const { emulateEgsPayload, computeGenerativeSeed } = await import('../../lib/egs-fractal-engine.mjs');
  const p = emulateEgsPayload('test-concept');
  assert.equal(typeof p.generative_seed, 'number');
  assert.ok(p.generative_seed > 0);
  assert.equal(p.nav.conceptId, 'test-concept');
  const s2 = computeGenerativeSeed({ x: p.nav.x, y: p.nav.y, z: p.nav.z }, 42);
  assert.ok(Number.isInteger(s2));
});
