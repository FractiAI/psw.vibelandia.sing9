/**
 * GET /api/services — Machine-readable service manifest (FREE, no payment required)
 * Serves public/services.json with live Vercel URLs injected.
 * NSPFRNP → ∞⁹
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { setCors, VERCEL_URL } = require('./_x402');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  let manifest;
  try {
    const raw = fs.readFileSync(
      path.join(__dirname, '..', 'public', 'services.json'), 'utf8'
    );
    manifest = JSON.parse(raw);
  } catch {
    // Inline fallback manifest
    manifest = {
      _schema: 'SING9-SERVICE-MANIFEST-v1',
      _note:   'Live on Vercel. Payment via x402 (USDC on Base). NSPFRNP → ∞⁹',
    };
  }

  // Inject live URLs
  const liveManifest = {
    ...manifest,
    _live_base_url: VERCEL_URL,
    endpoints: {
      'space-cloud':    `${VERCEL_URL}/api/space-cloud`,
      'goliath-report': `${VERCEL_URL}/api/goliath`,
      'os-upgrade':     `${VERCEL_URL}/api/os-upgrade`,
      'pitch-write':    `${VERCEL_URL}/api/pitch`,
      'services':       `${VERCEL_URL}/api/services`,
    },
    x402: {
      supported:    true,
      network:      process.env.X402_TESTNET === 'true' ? 'base-sepolia (testnet)' : 'base-mainnet',
      docs:         'https://docs.x402.org/getting-started/quickstart-for-buyers',
      wallet:       process.env.WALLET_USDC_BASE ?? '0x3563388d0e1c2d66a004e5e57717dc6d7e568be3',
    },
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.status(200).json(liveManifest);
};
