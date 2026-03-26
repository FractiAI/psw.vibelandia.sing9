import test from 'node:test';
import assert from 'node:assert/strict';
import { findProfileCoveringHiRest, H_I_REST_HZ } from '../../lib/openwebrx-public-evidence.mjs';

test('findProfileCoveringHiRest returns profile when passband covers H I', () => {
  const status = {
    sdrs: [
      {
        name: 'TestSDR',
        type: 'RtlSdrSource',
        profiles: [
          {
            name: 'HI L-band',
            center_freq: H_I_REST_HZ,
            sample_rate: 3e6,
          },
        ],
      },
    ],
  };
  const cov = findProfileCoveringHiRest(status);
  assert.ok(cov);
  assert.equal(cov.profile_name, 'HI L-band');
  assert.equal(cov.center_freq_hz, H_I_REST_HZ);
});

test('findProfileCoveringHiRest returns null when no profile covers H I', () => {
  const status = {
    sdrs: [
      {
        name: 'RTL',
        profiles: [{ name: '20m', center_freq: 14e6, sample_rate: 2.4e6 }],
      },
    ],
  };
  assert.equal(findProfileCoveringHiRest(status), null);
});
