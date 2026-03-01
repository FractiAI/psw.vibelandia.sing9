/**
 * GET /api/agent — ZHI agent discovery manifest
 *
 * Serves the x402-compatible agent.json that lets any A2A agent
 * discover our service catalog and buy autonomously.
 *
 * Also aliased at:
 *   /.well-known/agent.json  (via vercel.json rewrite)
 *   /agent.json              (via Vercel static file in /public)
 *
 * NSPFRNP → ∞⁹
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const { setCors, VERCEL_URL, EVM_ADDRESS } = require('./_x402');

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  let manifest;
  try {
    const raw = fs.readFileSync(
      path.join(__dirname, '..', 'public', 'agent.json'), 'utf8'
    );
    manifest = JSON.parse(raw);
  } catch {
    manifest = {};
  }

  // Inject live Vercel URL and wallet so it's always current
  const live = {
    ...manifest,
    _live_base_url: VERCEL_URL,
    agent: {
      ...(manifest.agent ?? {}),
      wallet_usdc_base: process.env.WALLET_USDC_BASE ?? EVM_ADDRESS,
    },
    // Rewrite all endpoint URLs with live base
    x402_endpoints: (manifest.x402_endpoints ?? []).map(e => ({
      ...e,
      url:     e.url?.replace('https://psw-vibelandia-sing9.vercel.app', VERCEL_URL),
      pay_to:  process.env.WALLET_USDC_BASE ?? EVM_ADDRESS,
    })),
    free_endpoints: (manifest.free_endpoints ?? []).map(e => ({
      ...e,
      url: e.url?.replace('https://psw-vibelandia-sing9.vercel.app', VERCEL_URL),
    })),
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).json(live);
};
