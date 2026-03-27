import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  enumerateProfileGeometry,
} from '../../lib/hline-passive-rf-probe.mjs';
import { findProfileCoveringHiRest, H_I_REST_HZ } from '../../lib/openwebrx-public-evidence.mjs';

describe('hline-passive-rf-probe (Tier 0 geometry)', () => {
  it('enumerates passband and matches finder when HI is in band', () => {
    const cf = H_I_REST_HZ;
    const sr = 2e6;
    const status = {
      sdrs: [
        {
          name: 'test-sdr',
          profiles: [{ name: 'p1', center_freq: cf, sample_rate: sr }],
        },
      ],
    };
    const rows = enumerateProfileGeometry(status);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].includes_hi_rest, true);
    const f = findProfileCoveringHiRest(status);
    assert.ok(f);
    assert.equal(f.profile_name, 'p1');
  });

  it('finder is null when HI is out of band', () => {
    const status = {
      sdrs: [
        {
          name: 'hf',
          profiles: [{ name: 'low', center_freq: 7e6, sample_rate: 12e3 }],
        },
      ],
    };
    const rows = enumerateProfileGeometry(status);
    assert.equal(rows[0].includes_hi_rest, false);
    assert.equal(findProfileCoveringHiRest(status), null);
  });
});
