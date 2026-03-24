import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateG5SurfProtocol,
  recommendedSyntheverseUiMode,
  KP_G5_SURF_TRIGGER,
  NARRATIVE_41MIN_LAG_S,
  HUMAN_INTERVENTION_REQUIRED,
} from '../../lib/g5-surf-protocol.mjs';

test('HUMAN_INTERVENTION_REQUIRED is false', () => {
  assert.equal(HUMAN_INTERVENTION_REQUIRED, false);
});

test('G5 SURF arms when Kp > threshold', () => {
  assert.equal(evaluateG5SurfProtocol({ kp: KP_G5_SURF_TRIGGER }).g5_surf_armed, false);
  assert.equal(evaluateG5SurfProtocol({ kp: KP_G5_SURF_TRIGGER + 0.01 }).g5_surf_armed, true);
  assert.equal(evaluateG5SurfProtocol({ kp: null }).g5_surf_armed, false);
});

test('Whistle mode when armed', () => {
  const s = evaluateG5SurfProtocol({ kp: 9 });
  assert.equal(s.resonance_mode, 'whistle');
  assert.equal(s.legacy_tcp_polling, 'disabled_narrative');
  assert.equal(s.narrative_encryption_key_seconds, NARRATIVE_41MIN_LAG_S);
});

test('recommendedSyntheverseUiMode', () => {
  assert.equal(recommendedSyntheverseUiMode({ kp: 4, legacyGridOk: true }), 'standard');
  assert.equal(recommendedSyntheverseUiMode({ kp: 4, legacyGridOk: false }), 'hydrogen-only');
  assert.equal(recommendedSyntheverseUiMode({ kp: 9, legacyGridOk: true }), 'hydrogen-only');
});
