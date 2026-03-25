import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SOVEREIGN_SEED_DESIGNATION,
  WHISTLE_MHZ,
  LAG_PROTOCOL_SECONDS,
  composeSovereignSeedState,
} from '../../lib/sovereign-seed-s2024j1.mjs';

test('Sovereign Seed designation and Whistle frequency', () => {
  assert.equal(SOVEREIGN_SEED_DESIGNATION, 'S/2024 J 1');
  assert.equal(WHISTLE_MHZ, 1420.4);
  assert.equal(LAG_PROTOCOL_SECONDS, 2476);
});

test('composeSovereignSeedState returns lattice rows', () => {
  const s = composeSovereignSeedState();
  assert.equal(s.sovereign_seed, 'S/2024 J 1');
  assert.equal(s.system_matrix.length, 4);
  assert.ok(!('first_hit_narrative' in s));
  assert.ok(!('blank_stones_narrative' in s));
});
