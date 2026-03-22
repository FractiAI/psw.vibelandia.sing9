import test from 'node:test';
import assert from 'node:assert/strict';
import { kpToGScale, goesSoftXrayClass } from '../../lib/observatory-public-evidence.mjs';

test('kpToGScale maps NOAA G-scale thresholds', () => {
  assert.equal(kpToGScale(4).label, 'below G1');
  assert.equal(kpToGScale(5).label, 'G1');
  assert.equal(kpToGScale(6.67).label, 'G2');
  assert.equal(kpToGScale(7).label, 'G3');
  assert.equal(kpToGScale(8).label, 'G4');
  assert.equal(kpToGScale(9).label, 'G5');
});

test('goesSoftXrayClass coarse bands', () => {
  assert.equal(goesSoftXrayClass(1e-8).cls, 'A');
  assert.equal(goesSoftXrayClass(1e-7).cls, 'B');
  assert.equal(goesSoftXrayClass(1e-6).cls, 'C');
  assert.equal(goesSoftXrayClass(1e-5).cls, 'M');
  assert.equal(goesSoftXrayClass(2e-4).cls, 'X');
});
