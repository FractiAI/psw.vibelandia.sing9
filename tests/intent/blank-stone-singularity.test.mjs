/**
 * Handler must satisfy T_EDGE_HYDROGEN — tests pull real api/*.js so refactors cannot silently break intent.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';
import { evaluateBlankStoneSingularity, HYDROGEN_REST_MHZ } from '../../lib/houdini-singularity.mjs';

const require = createRequire(import.meta.url);
const blankStoneHandler = require('../../api/blank-stone-hydrogen.js');

describe('api/blank-stone-hydrogen.js — T_EDGE_HYDROGEN singularity', () => {
  it('response body + headers pass evaluateBlankStoneSingularity', async () => {
    const capturedHeaders = {};
    const res = {
      setHeader(k, v) {
        capturedHeaders[String(k).toLowerCase()] = String(v);
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      },
    };

    await blankStoneHandler({}, res);

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body);
    assert.strictEqual(res.body.hydrogen_line_mhz, HYDROGEN_REST_MHZ);
    assert.ok(typeof res.body.packet_hex === 'string' && res.body.packet_hex.length >= 64);

    const ev = evaluateBlankStoneSingularity(res.body, capturedHeaders);
    assert.strictEqual(ev.pass, true, ev.violations?.join(', '));
    assert.strictEqual(capturedHeaders['x-sing9-blank-stone'], '1');
    assert.strictEqual(capturedHeaders['x-hydrogen-line-mhz'], String(HYDROGEN_REST_MHZ));
  });
});
